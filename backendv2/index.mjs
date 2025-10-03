import RPC from 'bare-rpc';
import b4a from 'b4a';
import crypto from 'hypercore-crypto';
import { log } from './logger.mjs';

import {
  RPC_INIT,
  RPC_SET_USER_PROFILE,
  RPC_GET_USER_PROFILE,
  RPC_START_CHAT_WITH_USER,
  RPC_GET_CHAT_MESSAGES,
  RPC_SEND_MESSAGE,
  RPC_CONNECT_BY_SHARE_CODE,
  RPC_GET_ACTIVE_CHATS,
  RPC_GENERATE_PUBLIC_INVITE,
  RPC_RESET_ALL_DATA,
  RPC_DESTROY,
  RPC_GET_PEER_STATUS,
  RPC_GET_KNOWN_PEERS,
} from './constants.mjs';

import { state, clearState, getAllChats, getOrCreateChat } from './state.mjs';
import {
  initializeStorage,
  closeStorage,
  loadMetadata,
  saveMetadata,
} from './storage.mjs';
import { initSwarm, joinChat, joinInvite } from './swarm.mjs';
import { getPeerStatus, deriveChatIdForPeer } from './peers.mjs';
import { sendChatMessage, getChatMessages } from './chat.mjs';
import { emitError, emitPeerConnecting } from './events.mjs';
import { encodeShareCode, decodeShareCode } from './qr.mjs';

const { IPC } = BareKit;

const rpc = new RPC(IPC, async (req) => {
  try {
    const dataStr = req.data
      ? Buffer.isBuffer(req.data)
        ? req.data.toString('utf8')
        : String(req.data)
      : '{}';
    const data = JSON.parse(dataStr);
    let res;
    switch (req.command) {
      case RPC_INIT:
        res = await onInit(data);
        break;
      case RPC_SET_USER_PROFILE:
        res = await onSetProfile(data);
        break;
      case RPC_GET_USER_PROFILE:
        res = await onGetProfile(data);
        break;
      case RPC_START_CHAT_WITH_USER:
        res = await onStartChatWithUser(data);
        break;
      case RPC_GET_CHAT_MESSAGES:
        res = await onGetChatMessages(data);
        break;
      case RPC_SEND_MESSAGE:
        res = await onSendMessage(data);
        break;
      case RPC_CONNECT_BY_SHARE_CODE:
        res = await onConnectByShareCode(data);
        break;
      case RPC_GET_ACTIVE_CHATS:
        res = await onGetActiveChats();
        break;
      case RPC_GENERATE_PUBLIC_INVITE:
        res = await onGeneratePublicInvite();
        break;
      case RPC_GET_PEER_STATUS:
        res = await onGetPeerStatus(data);
        break;
      case RPC_GET_KNOWN_PEERS:
        res = await onGetKnownPeers();
        break;
      case RPC_RESET_ALL_DATA:
        res = await onResetAllData();
        break;
      case RPC_DESTROY:
        res = await onDestroy();
        break;
      default:
        res = { success: false, error: 'Unknown command' };
    }
    req.reply(Buffer.from(JSON.stringify(res)));
  } catch (e) {
    emitError(e, 'rpc');
    req.reply(Buffer.from(JSON.stringify({ success: false, error: String(e) })));
  }
});

state.rpc = rpc;

async function onInit(data) {
  try {
    // Prevent double initialization
    if (state.initialized) {
      log.w('[INIT] ⚠️ Already initialized, returning existing userId:', state.userId?.slice(0, 16));
      return { success: true, userId: state.userId };
    }

    log.i('[INIT] 🚀 Starting fresh initialization...');
    const storagePath = data.storagePath || './whisper-v2';
    log.i('[INIT] Storage path:', storagePath);
    await initializeStorage(storagePath);

    // Generate/load keypair (simple deterministic store)
    const pkCore = state.corestore.get({ name: 'keypair' });
    await pkCore.ready();
    let pub = await pkCore.getUserData('pub');
    let sec = await pkCore.getUserData('sec');
    if (!pub || !sec) {
      const kp = crypto.keyPair();
      pub = kp.publicKey;
      sec = kp.secretKey;
      await pkCore.setUserData('pub', pub);
      await pkCore.setUserData('sec', sec);
    }
    state.userKeyPair = { publicKey: pub, secretKey: sec };
    state.userId = b4a.toString(pub, 'hex');

    await loadMetadata();
    await initSwarm();

    // Always advertise/join our invite topic so others can find us
    log.i('[INIT] Joining own invite topic');
    await joinInvite(state.userId);

    // HYBRID APPROACH: Backend starts immediately, chats join in parallel background
    const chatsList = Array.from(state.chats.values());
    if (chatsList.length > 0) {
      log.i(
        `[INIT] Starting background join for ${chatsList.length} chat(s)...`
      );
      setImmediate(() => {
        log.i('[INIT-BG] Starting DHT lookup and hole punching for existing chats...');
        const chatJoinPromises = chatsList.map(async (chat) => {
          try {
            log.i(`[INIT-BG] Joining chat topic for ${chat.id.slice(0, 16)}...`);
            await Promise.race([
              joinChat(chat.id),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 5000)
              ),
            ]);
            log.i(`[INIT-BG] ✓ Joined chat ${chat.id.slice(0, 16)}`);
          } catch (e) {
            log.w(`[INIT-BG] ✗ Failed to join chat ${chat.id.slice(0, 16)}`);
          }
        });
        Promise.allSettled(chatJoinPromises).then(() => {
          log.i('[INIT-BG] Background joins completed');
        });
      });
    }

    state.initialized = true;
    log.i('[INIT] ✅ Initialization complete! userId:', state.userId?.slice(0, 16));
    return { success: true, userId: state.userId };
  } catch (e) {
    log.e('[INIT] ❌ Critical initialization error:', e);
    state.initialized = false; // Reset on error
    return { success: false, error: String(e) };
  }
}

async function onSetProfile(data) {
  state.profile = { ...state.profile, ...data };
  await saveMetadata();
  return { success: true, profile: state.profile };
}

async function onGetProfile() {
  return { success: true, profile: state.profile, userId: state.userId };
}

async function onStartChatWithUser(data) {
  const { targetUserId } = data;
  if (!targetUserId) throw new Error('targetUserId required');
  const chatId = deriveChatIdForPeer(targetUserId);
  emitPeerConnecting(targetUserId);
  await joinInvite(targetUserId);
  await joinChat(chatId);
  getOrCreateChat(chatId, targetUserId);
  await saveMetadata();
  return { success: true, chatId };
}

async function onGetChatMessages(data) {
  const { chatId, limit } = data;
  const messages = await getChatMessages(chatId, limit ?? 50);
  return { success: true, messages };
}

async function onSendMessage(data) {
  const { chatId, text, type, ...metadata } = data;
  if (!chatId) throw new Error('chatId required');
  const r = await sendChatMessage(chatId, text || '', type || 'text', metadata);
  await saveMetadata();
  return { success: true, messageId: r.messageId };
}

async function onConnectByShareCode(data) {
  const { shareCode } = data;
  if (!shareCode) throw new Error('shareCode required');
  const targetPubKey = decodeShareCode(shareCode);
  const peerId = b4a.toString(targetPubKey, 'hex');
  const chatId = deriveChatIdForPeer(peerId);
  // Join their invite topic to find them and also the chat topic
  log.i('[RPC] connectByShareCode peerId=', peerId, 'chatId=', chatId);
  await joinInvite(peerId);
  await joinChat(chatId);
  getOrCreateChat(chatId, peerId);
  await saveMetadata();
  return { success: true, chatId, connectedTo: peerId };
}

async function onGetActiveChats() {
  const chats = getAllChats().map((c) => ({
    id: c.id,
    peerId: c.peerId,
    connected: c.connected,
  }));
  return { success: true, chats };
}

async function onGeneratePublicInvite() {
  const shareCode = encodeShareCode(state.userKeyPair.publicKey);
  return { success: true, shareCode };
}

async function onGetPeerStatus(data) {
  const { peerId } = data;
  return { success: true, status: getPeerStatus(peerId) };
}

async function onGetKnownPeers() {
  const peers = Array.from(state.peers.values()).map((p) => ({
    userId: p.peerId,
    profile: p.profile || undefined,
    lastSeen: p.lastSeen || Date.now(),
  }));
  return { success: true, peers };
}

async function onResetAllData() {
  log.i('[RESET] Starting comprehensive data reset...');
  log.i('[RESET] Current state summary:');
  log.i(`  - Peers: ${state.peers.size}`);
  log.i(`  - Chats: ${state.chats.size}`);
  log.i(`  - Invite discoveries: ${state.inviteDiscoveries.size}`);
  log.i(`  - Storage path: ${state.storagePath}`);

  try {
    // 1. Close all swarm connections and leave topics
    if (state.swarm) {
      log.i('[RESET] Destroying swarm connections and discoveries...');
      // Close all active connections
      for (const conn of state.swarm.connections) {
        try {
          conn.destroy();
        } catch {}
      }

      // Leave all invite topics
      for (const discovery of state.inviteDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {}
      }

      // Destroy swarm
      try {
        await state.swarm.destroy();
      } catch {}
      state.swarm = null;
    }

    // 2. Clear all user data from corestore
    if (state.localCore) {
      log.i('[RESET] Clearing corestore user data...');
      try {
        await state.localCore.setUserData('v2_peers', '[]');
        await state.localCore.setUserData('v2_chats', '[]');
        await state.localCore.setUserData('pub', null);
        await state.localCore.setUserData('sec', null);
        log.i('[RESET] Corestore user data cleared successfully');
      } catch (e) {
        log.w('[RESET] Error clearing corestore user data:', e);
      }
    }

    // 3. Close storage
    await closeStorage();

    // 4. Delete storage directory and all files
    if (state.storagePath) {
      const fs = await import('bare-fs');
      const path = await import('bare-path');

      const deleteDir = (dirPath) => {
        if (fs.existsSync(dirPath)) {
          const items = fs.readdirSync(dirPath);
          for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
              deleteDir(itemPath);
            } else {
              fs.unlinkSync(itemPath);
            }
          }
          fs.rmdirSync(dirPath);
        }
      };

      try {
        deleteDir(state.storagePath);
      } catch {}
    }

    // 5. Clear all in-memory state
    log.i('[RESET] Clearing in-memory state...');
    clearState(); // This clears peers, chats, inviteDiscoveries
    state.userId = null;
    state.userKeyPair = null;
    state.profile = {};
    state.initialized = false;
    state.storagePath = null;
    state.corestore = null;
    state.localCore = null;

    // Double-check all maps are cleared
    state.peers.clear();
    state.chats.clear();
    state.inviteDiscoveries.clear();
    log.i('[RESET] In-memory state cleared successfully');

    return { success: true, message: 'All data reset successfully' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function onDestroy() {
  try {
    log.i('[DESTROY] Starting graceful shutdown...');

    // 1. Close all swarm connections and discoveries
    if (state.swarm) {
      log.i('[DESTROY] Closing swarm connections...');
      for (const conn of state.swarm.connections) {
        try {
          conn.destroy();
        } catch {}
      }

      // Close all invite discoveries
      for (const discovery of state.inviteDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {}
      }
      state.inviteDiscoveries.clear();

      // Destroy swarm
      try {
        await state.swarm.destroy();
      } catch {}
      state.swarm = null;
      log.i('[DESTROY] Swarm closed');
    }

    // 2. Close storage
    log.i('[DESTROY] Closing storage...');
    await closeStorage();

    // 3. Clear state
    state.peers.clear();
    state.chats.clear();
    state.rpc = null;
    state.initialized = false;
    state.corestore = null;
    state.localCore = null;
    // Don't clear storagePath - we'll reuse it on restart
    // Don't clear userId/userKeyPair - they'll be loaded from storage on restart

    log.i('[DESTROY] ✅ Shutdown complete');
    return { success: true };
  } catch (e) {
    log.e('[DESTROY] ❌ Error during shutdown:', e);
    return { success: false, error: String(e) };
  }
}
