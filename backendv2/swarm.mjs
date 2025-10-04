import Hyperswarm from 'hyperswarm';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';
import Protomux from 'protomux';
import c from 'compact-encoding';
import { log } from './logger.mjs';
import { persistedState, memoryState, getOrCreatePeer } from './state.mjs';
import { registerConnection, unregisterConnection } from './peers.mjs';
import { handleIncomingChannelData } from './chat.mjs';
import { saveMetadata } from './storage.mjs';
import { emitPeerConnected } from './events.mjs';

export function topicFromChatId(chatId) {
  // hash chatId into 32-byte topic
  const h = crypto.hash(b4a.from(chatId));
  return h.subarray(0, 32);
}

export function topicFromPeerId(peerIdHex) {
  const h = crypto.hash(b4a.from(`invite:${peerIdHex}`));
  return h.subarray(0, 32);
}

export async function initSwarm() {
  if (memoryState.swarm) return memoryState.swarm;
  memoryState.swarm = new Hyperswarm();
  memoryState.swarm.on('connection', (conn, info) => {
    const remotePublicKey = info?.publicKey || conn.remotePublicKey;
    const candidateId = remotePublicKey
      ? b4a.toString(remotePublicKey, 'hex')
      : 'unknown';

    log.i('[SWARM] connection: candidateId=', candidateId);

    const mux = new Protomux(conn);

    // Create chat channel FIRST (before control)
    const chat = mux.createChannel({
      protocol: 'whisper/chat/2',
      onclose: () => {
        log.i('[CHAT] close for', conn._remoteUserId || candidateId);
        // Do not call unregisterConnection here to avoid duplicate disconnect events.
        // Control channel close will handle unregistering the peer once.
      },
    });

    const chatMessage = chat.addMessage({
      encoding: c.raw,
      onmessage: (buf) => {
        if (!conn._remoteUserId) return;
        log.i('[CHAT] message bytes len=', buf?.length, 'from', conn._remoteUserId);
        handleIncomingChannelData(conn._remoteUserId, buf);
      },
    });

    // Create control channel with handshake
    const control = mux.createChannel({
      protocol: 'whisper/control/2',
      handshake: c.json,
      onopen: async (remoteHandshake) => {
        try {
          log.i(
            '[CONTROL] Handshake complete with',
            remoteHandshake.userId,
            'profile:',
            !!remoteHandshake.profile
          );

          conn._remoteUserId = remoteHandshake.userId;

          // Deduplicate using deterministic tie-breaking on TRANSPORT stream
          const existingTransport = memoryState.peerTransports.get(remoteHandshake.userId);
          if (existingTransport && existingTransport !== conn) {
            // Deterministic strategy: peer with LOWER userId keeps their OUTGOING connection
            // Peer with HIGHER userId accepts INCOMING connection
            const shouldKeepNewConnection = persistedState.userId > remoteHandshake.userId;

            if (shouldKeepNewConnection) {
              log.i(
                '[CONTROL] Replacing old outgoing with incoming from',
                remoteHandshake.userId.slice(0, 8),
                '(we have higher userId)'
              );
              // Close our old outgoing, accept this incoming
              try {
                existingTransport._isDuplicate = true;
                existingTransport.destroy();
              } catch (e) {
                log.w('[CONTROL] Failed to close old connection', e);
              }
              // Track new transport
              memoryState.peerTransports.set(remoteHandshake.userId, conn);
              // Continue with this new connection
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
              return; // Stop processing
            }
          }

          // Get or create peer and update profile
          const p = getOrCreatePeer(remoteHandshake.userId);
          if (remoteHandshake.profile) {
            p.profile = remoteHandshake.profile;
            log.i('[CONTROL] Profile saved:', remoteHandshake.profile);
          } else {
            log.w('[CONTROL] No profile in handshake from', remoteHandshake.userId);
          }

          // Save metadata to persist the profile
          try {
            await saveMetadata();
            log.i('[CONTROL] Metadata saved');
          } catch (e) {
            log.w('[CONTROL] Failed to save metadata', e);
          }

          // DON'T close invite discovery - keep it open for auto-reconnect
          // Invite topic serves as a backup discovery path
          log.i(
            '[CONTROL] Keeping invite discovery open for',
            remoteHandshake.userId.slice(0, 8),
            'as backup connection path'
          );

          // Register connection with chat writer
          const chatWriter = { write: (b) => chatMessage.send(b) };
          const chatId = await registerConnection(remoteHandshake.userId, chatWriter);

          // Ensure current transport is tracked
          memoryState.peerTransports.set(remoteHandshake.userId, conn);

          // Emit peer connected event with profile
          emitPeerConnected(remoteHandshake.userId, chatId, p.profile || {});
          log.i('[CONTROL] RPC_PEER_CONNECTED emitted with profile:', !!p.profile);
        } catch (e) {
          log.e('[CONTROL] Error in handshake handler:', e);
        }
      },
      onclose: () => {
        log.i('[CONTROL] close for', conn._remoteUserId || candidateId);
        // Don't unregister duplicates (they were never registered)
        if (!conn._isDuplicate) {
          unregisterConnection(conn._remoteUserId || candidateId);
        }
      },
    });

    // Open control channel WITH our handshake data
    log.i('[CONTROL] Opening control channel, sending handshake...');
    control.open({
      userId: persistedState.userId,
      profile: persistedState.profile,
    });

    // Open chat channel immediately (both peers do this, no waiting)
    log.i('[CHAT] Opening chat channel...');
    chat.open();
  });
  return memoryState.swarm;
}

export async function joinChat(chatId) {
  // Check if already joined - prevents duplicate joins and 500ms+ delays
  const existing = memoryState.chatDiscoveries.get(chatId);
  if (existing) {
    log.i(`[SWARM] Already joined chat topic for ${chatId.slice(0, 16)}, skipping...`);
    return existing;
  }

  if (!memoryState.swarm) throw new Error('Swarm not initialized - call onInit() first');
  const topic = topicFromChatId(chatId);
  log.i(`[SWARM] Joining NEW chat topic for ${chatId.slice(0, 16)}...`);
  const discovery = memoryState.swarm.join(topic, { client: true, server: true });
  
  // Store discovery BEFORE flushing to prevent race conditions
  memoryState.chatDiscoveries.set(chatId, discovery);
  
  log.i(`[SWARM] Waiting for DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Chat topic joined, listening for connections...`);
  return discovery;
}

export async function joinInvite(peerIdHex) {
  // Check if already joined
  const existing = memoryState.inviteDiscoveries.get(peerIdHex);
  if (existing) {
    log.i(`[SWARM] Already joined invite topic for ${peerIdHex.slice(0, 8)}, skipping...`);
    return existing;
  }

  if (!memoryState.swarm) throw new Error('Swarm not initialized - call onInit() first');
  const topic = topicFromPeerId(peerIdHex);
  log.i(`[SWARM] Joining invite topic for peer ${peerIdHex.slice(0, 8)}...`);
  const discovery = memoryState.swarm.join(topic, { client: true, server: true });
  log.i(`[SWARM] Waiting for invite DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Invite topic joined, peer discovery active...`);
  memoryState.inviteDiscoveries.set(peerIdHex, discovery);
  return discovery;
}
