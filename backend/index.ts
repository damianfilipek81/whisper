import RPC from 'bare-rpc';
import type { IncomingRequest as RPCIncomingRequest } from 'bare-rpc';
import b4a from 'b4a';
import crypto from 'hypercore-crypto';
import { log } from './logger.js';

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
} from '../shared/constants.js';

import {
  persistedState,
  memoryState,
  clearAllState,
  clearMemoryState,
  getAllChats,
  getOrCreateChat,
} from './state.js';
import {
  initializeStorage,
  closeStorage,
  loadMetadata,
  saveMetadata,
} from './storage.js';
import { initSwarm, joinChat, joinInvite } from './swarm.js';
import { getPeerStatus, deriveChatIdForPeer } from './peers.js';
import { sendChatMessage, getChatMessages } from './chat.js';
import { emitError, emitPeerConnecting } from './events.js';
import { encodeShareCode, decodeShareCode } from './qr.js';
import type { RPCRequestData, RPCResponse } from './types.js';

// @ts-ignore - BareKit is a global
const { IPC } = BareKit;

const rpc = new RPC(IPC, async (req: RPCIncomingRequest) => {
  try {
    const dataStr = req.data
      ? Buffer.isBuffer(req.data)
        ? req.data.toString('utf8')
        : String(req.data)
      : '{}';
    const data: RPCRequestData = JSON.parse(dataStr);
    let res: RPCResponse;
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
    req.reply(Buffer.from(JSON.stringify(res)) as any);
  } catch (e) {
    emitError(e as Error, 'rpc');
    req.reply(
      Buffer.from(JSON.stringify({ success: false, error: String(e) })) as any
    );
  }
});

memoryState.rpc = rpc;

async function onInit(data: RPCRequestData): Promise<RPCResponse> {
  try {
    if (memoryState.initialized) {
      log.w(
        '[INIT] ⚠️ Already initialized, returning existing userId:',
        persistedState.userId?.slice(0, 16)
      );
      return { success: true, userId: persistedState.userId || undefined };
    }

    log.i('[INIT] 🚀 Starting fresh initialization...');
    const storagePath = data.storagePath || './whisper-v2';
    log.i('[INIT] Storage path:', storagePath);
    await initializeStorage(storagePath);

    const pkCore = memoryState.corestore!.get({ name: 'keypair' });
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
    persistedState.userKeyPair = { publicKey: pub, secretKey: sec };
    persistedState.userId = b4a.toString(pub, 'hex');

    await loadMetadata();
    await initSwarm();

    log.i('[INIT] Joining own invite topic');
    await joinInvite(persistedState.userId);

    // Backend starts immediately, existing chats join in background to avoid blocking
    const chatsList = Array.from(persistedState.chats.values());
    if (chatsList.length > 0) {
      log.i(`[INIT] Starting background join for ${chatsList.length} chat(s)...`);
      setImmediate(() => {
        log.i('[INIT-BG] Starting DHT lookup and hole punching for existing chats...');

        const joinPromises = chatsList.map(async (chat) => {
          try {
            log.i(`[INIT-BG] Joining invite topic for peer ${chat.peerId.slice(0, 8)}...`);
            await Promise.race([
              joinInvite(chat.peerId),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('invite timeout')), 3000)
              ),
            ]);
            log.i(`[INIT-BG] ✓ Joined invite for peer ${chat.peerId.slice(0, 8)}`);

            log.i(`[INIT-BG] Joining chat topic for ${chat.id.slice(0, 16)}...`);
            await Promise.race([
              joinChat(chat.id),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('chat timeout')), 3000)
              ),
            ]);
            log.i(`[INIT-BG] ✓ Joined chat ${chat.id.slice(0, 16)}`);
          } catch (e: any) {
            log.w(`[INIT-BG] ✗ Failed to join chat ${chat.id.slice(0, 16)}: ${e.message}`);
          }
        });

        Promise.allSettled(joinPromises).then(() => {
          log.i('[INIT-BG] Background joins completed');
        });
      });
    }

    memoryState.initialized = true;
    log.i('[INIT] ✅ Initialization complete! userId:', persistedState.userId?.slice(0, 16));
    return { success: true, userId: persistedState.userId };
  } catch (e) {
    log.e('[INIT] ❌ Critical initialization error:', e);
    memoryState.initialized = false;
    return { success: false, error: String(e) };
  }
}

async function onSetProfile(data: RPCRequestData): Promise<RPCResponse> {
  persistedState.profile = { ...persistedState.profile, ...data };
  await saveMetadata();
  return { success: true, profile: persistedState.profile };
}

async function onGetProfile(data: RPCRequestData): Promise<RPCResponse> {
  return {
    success: true,
    profile: persistedState.profile,
    userId: persistedState.userId || undefined,
  };
}

async function onStartChatWithUser(data: RPCRequestData): Promise<RPCResponse> {
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

async function onGetChatMessages(data: RPCRequestData): Promise<RPCResponse> {
  const { chatId, limit } = data;
  if (!chatId) throw new Error('chatId required');
  const messages = await getChatMessages(chatId, limit ?? 50);
  return { success: true, messages };
}

async function onSendMessage(data: RPCRequestData): Promise<RPCResponse> {
  const { chatId, text, type, ...metadata } = data;
  if (!chatId) throw new Error('chatId required');
  const r = await sendChatMessage(chatId, text || '', type || 'text', metadata);
  await saveMetadata();
  return { success: true, messageId: r.messageId };
}

async function onConnectByShareCode(data: RPCRequestData): Promise<RPCResponse> {
  const { shareCode } = data;
  if (!shareCode) throw new Error('shareCode required');
  const targetPubKey = decodeShareCode(shareCode);
  const peerId = b4a.toString(targetPubKey, 'hex');
  const chatId = deriveChatIdForPeer(peerId);
  log.i('[RPC] connectByShareCode peerId=', peerId, 'chatId=', chatId);
  await joinInvite(peerId);
  await joinChat(chatId);
  getOrCreateChat(chatId, peerId);
  await saveMetadata();
  return { success: true, chatId, connectedTo: peerId };
}

async function onGetActiveChats(): Promise<RPCResponse> {
  const chats = getAllChats();
  return { success: true, chats };
}

async function onGeneratePublicInvite(): Promise<RPCResponse> {
  if (!persistedState.userKeyPair) throw new Error('User keypair not initialized');
  const shareCode = encodeShareCode(persistedState.userKeyPair.publicKey);
  return { success: true, shareCode };
}

async function onGetPeerStatus(data: RPCRequestData): Promise<RPCResponse> {
  const { peerId } = data;
  if (!peerId) throw new Error('peerId required');
  return { success: true, status: getPeerStatus(peerId) };
}

async function onGetKnownPeers(): Promise<RPCResponse> {
  const peers = Array.from(persistedState.peers.values()).map((p) => ({
    userId: p.peerId,
    profile: p.profile || undefined,
    lastSeen: p.lastSeen || Date.now(),
  }));
  return { success: true, peers };
}

async function onResetAllData(): Promise<RPCResponse> {
  log.i('[RESET] Starting comprehensive data reset...');
  log.i('[RESET] Current state summary:');
  log.i(`  - Peers: ${persistedState.peers.size}`);
  log.i(`  - Chats: ${persistedState.chats.size}`);
  log.i(`  - Invite discoveries: ${memoryState.inviteDiscoveries.size}`);
  log.i(`  - Storage path: ${memoryState.storagePath}`);

  try {
    if (memoryState.swarm) {
      log.i('[RESET] Destroying swarm connections and discoveries...');
      for (const conn of memoryState.swarm.connections) {
        try {
          conn.destroy();
        } catch {}
      }

      for (const discovery of memoryState.inviteDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {}
      }

      for (const discovery of memoryState.chatDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {}
      }

      try {
        await memoryState.swarm.destroy();
      } catch {}
      memoryState.swarm = null;
    }

    if (memoryState.localCore) {
      log.i('[RESET] Clearing corestore user data...');
      try {
        await memoryState.localCore.setUserData('v2_peers', '[]');
        await memoryState.localCore.setUserData('v2_chats', '[]');
        await memoryState.localCore.setUserData('pub', null);
        await memoryState.localCore.setUserData('sec', null);
        log.i('[RESET] Corestore user data cleared successfully');
      } catch (e) {
        log.w('[RESET] Error clearing corestore user data:', e);
      }
    }

    await closeStorage();

    if (memoryState.storagePath) {
      // @ts-ignore - bare-fs modules
      const fs = await import('bare-fs');
      // @ts-ignore
      const path = await import('bare-path');

      const deleteDir = (dirPath: string): void => {
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
        deleteDir(memoryState.storagePath);
      } catch {}
    }

    log.i('[RESET] Clearing all state...');
    clearAllState();
    memoryState.initialized = false;
    memoryState.storagePath = null;
    memoryState.corestore = null;
    memoryState.localCore = null;
    log.i('[RESET] All state cleared successfully');

    return { success: true, message: 'All data reset successfully' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function onDestroy(): Promise<RPCResponse> {
  try {
    log.i('[DESTROY] Starting graceful shutdown...');

    if (memoryState.swarm) {
      log.i('[DESTROY] Closing swarm connections...');
      for (const conn of memoryState.swarm.connections) {
        try {
          conn.destroy();
        } catch {}
      }

      for (const discovery of memoryState.inviteDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {}
      }

      for (const discovery of memoryState.chatDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {}
      }

      try {
        await memoryState.swarm.destroy();
      } catch {}
      memoryState.swarm = null;
      log.i('[DESTROY] Swarm closed');
    }

    log.i('[DESTROY] Closing storage...');
    await closeStorage();

    // Keep persisted data for next restart
    clearMemoryState();
    memoryState.rpc = null;
    memoryState.initialized = false;
    memoryState.corestore = null;
    memoryState.localCore = null;

    log.i('[DESTROY] ✅ Shutdown complete');
    return { success: true };
  } catch (e) {
    log.e('[DESTROY] ❌ Error during shutdown:', e);
    return { success: false, error: String(e) };
  }
}
