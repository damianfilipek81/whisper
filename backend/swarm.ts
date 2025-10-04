import Hyperswarm from 'hyperswarm';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';
import Protomux from 'protomux';
import c from 'compact-encoding';
import { log } from './logger.js';
import { persistedState, memoryState, getOrCreatePeer } from './state.js';
import { registerConnection, unregisterConnection } from './peers.js';
import { handleIncomingChannelData } from './chat.js';
import { saveMetadata } from './storage.js';
import { emitPeerConnected } from './events.js';
import type { Handshake } from './types.js';
import type { Discovery } from 'hyperswarm';

export function topicFromChatId(chatId: string): Buffer {
  const h = crypto.hash(b4a.from(chatId));
  return h.subarray(0, 32);
}

export function topicFromPeerId(peerIdHex: string): Buffer {
  const h = crypto.hash(b4a.from(`invite:${peerIdHex}`));
  return h.subarray(0, 32);
}

export async function initSwarm(): Promise<Hyperswarm> {
  if (memoryState.swarm) return memoryState.swarm;
  memoryState.swarm = new Hyperswarm();
  memoryState.swarm.on('connection', (conn: any, info: any) => {
    const remotePublicKey = info?.publicKey || conn.remotePublicKey;
    const candidateId = remotePublicKey
      ? b4a.toString(remotePublicKey, 'hex')
      : 'unknown';

    log.i('[SWARM] connection: candidateId=', candidateId);

    const mux = new Protomux(conn);

    const chat = mux.createChannel({
      protocol: 'whisper/chat/2',
      onclose: () => {
        log.i('[CHAT] close for', conn._remoteUserId || candidateId);
      },
    });

    const chatMessage = chat.addMessage({
      encoding: c.raw,
      onmessage: (buf: Buffer) => {
        if (!conn._remoteUserId) return;
        log.i('[CHAT] message bytes len=', buf?.length, 'from', conn._remoteUserId);
        handleIncomingChannelData(conn._remoteUserId, buf);
      },
    });

    const control = mux.createChannel({
      protocol: 'whisper/control/2',
      handshake: c.json,
      onopen: async (remoteHandshake: Handshake) => {
        try {
          log.i(
            '[CONTROL] Handshake complete with',
            remoteHandshake.userId,
            'profile:',
            !!remoteHandshake.profile
          );

          conn._remoteUserId = remoteHandshake.userId;

          // Deduplicate connections: peer with lower userId keeps outgoing, higher accepts incoming
          const existingTransport = memoryState.peerTransports.get(
            remoteHandshake.userId
          );
          if (existingTransport && existingTransport !== conn) {
            const shouldKeepNewConnection =
              persistedState.userId! > remoteHandshake.userId;

            if (shouldKeepNewConnection) {
              log.i(
                '[CONTROL] Replacing old outgoing with incoming from',
                remoteHandshake.userId.slice(0, 8),
                '(we have higher userId)'
              );
              try {
                existingTransport._isDuplicate = true;
                existingTransport.destroy();
              } catch (e) {
                log.w('[CONTROL] Failed to close old connection', e);
              }
              memoryState.peerTransports.set(remoteHandshake.userId, conn);
            } else {
              log.i(
                '[CONTROL] Keeping our outgoing, closing incoming from',
                remoteHandshake.userId.slice(0, 8),
                '(we have lower userId)'
              );
              conn._isDuplicate = true;
              try {
                conn.destroy();
              } catch (e) {
                log.w('[CONTROL] Failed to close duplicate', e);
              }
              return;
            }
          }

          const p = getOrCreatePeer(remoteHandshake.userId);
          if (remoteHandshake.profile) {
            p.profile = remoteHandshake.profile;
            log.i('[CONTROL] Profile saved:', remoteHandshake.profile);
          } else {
            log.w('[CONTROL] No profile in handshake from', remoteHandshake.userId);
          }

          try {
            await saveMetadata();
            log.i('[CONTROL] Metadata saved');
          } catch (e) {
            log.w('[CONTROL] Failed to save metadata', e);
          }

          // Keep invite discovery open for auto-reconnect
          log.i(
            '[CONTROL] Keeping invite discovery open for',
            remoteHandshake.userId.slice(0, 8),
            'as backup connection path'
          );

          const chatWriter = { write: (b: Buffer) => chatMessage.send(b) };
          const chatId = await registerConnection(remoteHandshake.userId, chatWriter);
          memoryState.peerTransports.set(remoteHandshake.userId, conn);
          emitPeerConnected(remoteHandshake.userId, chatId, p.profile || {});
          log.i('[CONTROL] RPC_PEER_CONNECTED emitted with profile:', !!p.profile);
        } catch (e) {
          log.e('[CONTROL] Error in handshake handler:', e);
        }
      },
      onclose: () => {
        log.i('[CONTROL] close for', conn._remoteUserId || candidateId);
        if (!conn._isDuplicate) {
          unregisterConnection(conn._remoteUserId || candidateId);
        }
      },
    });

    log.i('[CONTROL] Opening control channel, sending handshake...');
    control.open({
      userId: persistedState.userId!,
      profile: persistedState.profile,
    });

    log.i('[CHAT] Opening chat channel...');
    chat.open();
  });
  return memoryState.swarm;
}

export async function joinChat(chatId: string): Promise<Discovery> {
  const existing = memoryState.chatDiscoveries.get(chatId);
  if (existing) {
    log.i(
      `[SWARM] Already joined chat topic for ${chatId.slice(0, 16)}, skipping...`
    );
    return existing;
  }

  if (!memoryState.swarm)
    throw new Error('Swarm not initialized - call onInit() first');
  const topic = topicFromChatId(chatId);
  log.i(`[SWARM] Joining NEW chat topic for ${chatId.slice(0, 16)}...`);
  const discovery = memoryState.swarm.join(topic, { client: true, server: true });
  memoryState.chatDiscoveries.set(chatId, discovery);

  log.i(`[SWARM] Waiting for DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Chat topic joined, listening for connections...`);
  return discovery;
}

export async function joinInvite(peerIdHex: string): Promise<Discovery> {
  const existing = memoryState.inviteDiscoveries.get(peerIdHex);
  if (existing) {
    log.i(
      `[SWARM] Already joined invite topic for ${peerIdHex.slice(0, 8)}, skipping...`
    );
    return existing;
  }

  if (!memoryState.swarm)
    throw new Error('Swarm not initialized - call onInit() first');
  const topic = topicFromPeerId(peerIdHex);
  log.i(`[SWARM] Joining invite topic for peer ${peerIdHex.slice(0, 8)}...`);
  const discovery = memoryState.swarm.join(topic, { client: true, server: true });
  log.i(`[SWARM] Waiting for invite DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Invite topic joined, peer discovery active...`);
  memoryState.inviteDiscoveries.set(peerIdHex, discovery);
  return discovery;
}
