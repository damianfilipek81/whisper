import Hyperswarm from 'hyperswarm';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';
import Protomux from 'protomux';
import c from 'compact-encoding';
import { log } from './logger.mjs';
import { state, getOrCreatePeer } from './state.mjs';
import { registerConnection, unregisterConnection } from './peers.mjs';
import { handleIncomingChannelData, ensureChat } from './chat.mjs';
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
  if (state.swarm) return state.swarm;
  state.swarm = new Hyperswarm();
  state.swarm.on('connection', (conn, info) => {
    const remotePublicKey = info?.publicKey || conn.remotePublicKey;
    const candidateId = remotePublicKey
      ? b4a.toString(remotePublicKey, 'hex')
      : 'unknown';

    log.i('[SWARM] connection: candidateId=', candidateId);

    const mux = new Protomux(conn);

    const control = mux.createChannel({
      protocol: 'whisper/control/2',
      handshake: c.json, // Encoding schema - Protomux will encode/decode automatically
      onopen: async (remoteHandshake) => {
        try {
          // Protomux automatically decodes handshake using c.json
          log.i(
            '[CONTROL] Handshake complete with',
            remoteHandshake.userId,
            'profile:',
            !!remoteHandshake.profile
          );

          conn._remoteUserId = remoteHandshake.userId;

          // Deduplicate using deterministic tie-breaking on TRANSPORT stream
          const existingTransport = state.peerTransports.get(remoteHandshake.userId);
          if (existingTransport && existingTransport !== conn) {
            // Deterministic strategy: peer with LOWER userId keeps their OUTGOING connection
            // Peer with HIGHER userId accepts INCOMING connection
            const shouldKeepNewConnection = state.userId > remoteHandshake.userId;

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
              state.peerTransports.set(remoteHandshake.userId, conn);
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
            log.w(
              '[CONTROL] No profile in handshake from',
              remoteHandshake.userId
            );
          }

          // Save metadata to persist the profile
          try {
            await saveMetadata();
            log.i('[CONTROL] Metadata saved');
          } catch (e) {
            log.w('[CONTROL] Failed to save metadata', e);
          }

          // Close invite discovery for this peer - we now use chat topic only
          const inviteDiscovery = state.inviteDiscoveries.get(remoteHandshake.userId);
          if (inviteDiscovery) {
            log.i(
              '[CONTROL] Closing invite discovery for',
              remoteHandshake.userId.slice(0, 8)
            );
            try {
              await inviteDiscovery.destroy();
              state.inviteDiscoveries.delete(remoteHandshake.userId);
            } catch {}
          }

          // Register connection
          const chatWriter = { write: (b) => chatMessage.send(b) };
          const chatId = await registerConnection(remoteHandshake.userId, chatWriter);
          await ensureChat(remoteHandshake.userId);
          if (!chat.opened) chat.open();

          // Ensure current transport is tracked
          state.peerTransports.set(remoteHandshake.userId, conn);

          // Emit peer connected event with profile
          emitPeerConnected(remoteHandshake.userId, chatId, p.profile || {});
          log.i(
            '[CONTROL] RPC_PEER_CONNECTED emitted with profile:',
            !!p.profile
          );
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
        log.i(
          '[CHAT] message bytes len=',
          buf?.length,
          'from',
          conn._remoteUserId
        );
        handleIncomingChannelData(conn._remoteUserId, buf);
      },
    });

    // Open control channel WITH our handshake data
    log.i('[CONTROL] Opening control channel, sending handshake...');
    control.open({
      userId: state.userId,
      profile: state.profile,
    });
    // Chat channel will be opened after handshake completes in onopen handler
  });
  return state.swarm;
}

export async function joinChat(chatId) {
  const swarm = await initSwarm();
  const topic = topicFromChatId(chatId);
  log.i(`[SWARM] Joining chat topic for ${chatId.slice(0, 16)}...`);
  const discovery = swarm.join(topic, { client: true, server: true });
  log.i(`[SWARM] Waiting for DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Chat topic joined, listening for connections...`);
  return discovery;
}

export async function joinInvite(peerIdHex) {
  const swarm = await initSwarm();
  const topic = topicFromPeerId(peerIdHex);
  log.i(`[SWARM] Joining invite topic for peer ${peerIdHex.slice(0, 8)}...`);
  const discovery = swarm.join(topic, { client: true, server: true });
  log.i(`[SWARM] Waiting for invite DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Invite topic joined, peer discovery active...`);
  state.inviteDiscoveries.set(peerIdHex, discovery);
  return discovery;
}
