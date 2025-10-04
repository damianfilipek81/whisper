// backend/index.ts
import RPC from "bare-rpc";
import b4a4 from "b4a";
import crypto2 from "hypercore-crypto";

// backend/logger.ts
function formatTimestamp() {
  const now = /* @__PURE__ */ new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${hours}:${minutes}:${seconds}:${ms}`;
}
function logWithLevel(level, ...args) {
  const timestamp = formatTimestamp();
  console.log(`[${timestamp}] [${level}]`, ...args);
}
var log = {
  i: (...args) => logWithLevel("INFO", ...args),
  w: (...args) => logWithLevel("WARN", ...args),
  e: (...args) => logWithLevel("ERROR", ...args)
};

// shared/constants.ts
var RPC_INIT = 1;
var RPC_SET_USER_PROFILE = 2;
var RPC_GET_USER_PROFILE = 3;
var RPC_START_CHAT_WITH_USER = 4;
var RPC_GET_CHAT_MESSAGES = 5;
var RPC_SEND_MESSAGE = 6;
var RPC_CONNECT_BY_SHARE_CODE = 7;
var RPC_GET_ACTIVE_CHATS = 8;
var RPC_GENERATE_PUBLIC_INVITE = 9;
var RPC_RESET_ALL_DATA = 10;
var RPC_DESTROY = 11;
var RPC_GET_PEER_STATUS = 12;
var RPC_GET_KNOWN_PEERS = 13;
var RPC_PEER_CONNECTED = 100;
var RPC_PEER_DISCONNECTED = 101;
var RPC_MESSAGE_RECEIVED = 102;
var RPC_ERROR = 104;

// backend/state.ts
var persistedState = {
  userId: null,
  userKeyPair: null,
  profile: {},
  peers: /* @__PURE__ */ new Map(),
  chats: /* @__PURE__ */ new Map()
};
var memoryState = {
  rpc: null,
  corestore: null,
  localCore: null,
  swarm: null,
  initialized: false,
  storagePath: null,
  inviteDiscoveries: /* @__PURE__ */ new Map(),
  chatDiscoveries: /* @__PURE__ */ new Map(),
  peerTransports: /* @__PURE__ */ new Map(),
  activeConnections: /* @__PURE__ */ new Map()
};
function clearMemoryState() {
  memoryState.inviteDiscoveries.clear();
  memoryState.chatDiscoveries.clear();
  memoryState.peerTransports.clear();
  memoryState.activeConnections.clear();
}
function clearAllState() {
  persistedState.peers.clear();
  persistedState.chats.clear();
  persistedState.userId = null;
  persistedState.userKeyPair = null;
  persistedState.profile = {};
  clearMemoryState();
}
function getOrCreateChat(chatId, peerId) {
  let chat = persistedState.chats.get(chatId);
  if (!chat) {
    chat = {
      id: chatId,
      peerId,
      messages: []
    };
    persistedState.chats.set(chatId, chat);
  }
  return chat;
}
function getOrCreatePeer(peerId) {
  let peer = persistedState.peers.get(peerId);
  if (!peer) {
    peer = {
      peerId,
      lastSeen: Date.now()
    };
    persistedState.peers.set(peerId, peer);
  }
  return peer;
}
function getAllChats() {
  return Array.from(persistedState.chats.values()).map((chat) => {
    const peer = persistedState.peers.get(chat.peerId);
    return {
      ...chat,
      peerConnected: memoryState.activeConnections.has(chat.peerId),
      peerProfile: peer?.profile
    };
  });
}
function registerActiveConnection(peerId, chatWriter, transport) {
  memoryState.activeConnections.set(peerId, {
    chatWriter,
    transport,
    connected: true,
    connectedAt: Date.now()
  });
}
function unregisterActiveConnection(peerId) {
  memoryState.activeConnections.delete(peerId);
}
function getActiveConnection(peerId) {
  return memoryState.activeConnections.get(peerId);
}

// backend/storage.ts
import Corestore from "corestore";
async function initializeStorage(storagePath) {
  memoryState.storagePath = storagePath;
  memoryState.corestore = new Corestore(storagePath);
  await memoryState.corestore.ready();
  memoryState.localCore = memoryState.corestore.get({ name: "local" });
  await memoryState.localCore.ready();
}
async function closeStorage() {
  try {
    await memoryState.corestore?.close();
  } catch (error) {
    log.w("[STORAGE] Error closing storage:", error);
  }
}
async function saveMetadata() {
  if (!memoryState.localCore) return;
  const peers = JSON.stringify(Array.from(persistedState.peers.values()));
  const chats = JSON.stringify(
    Array.from(persistedState.chats.values()).map((c2) => ({
      id: c2.id,
      peerId: c2.peerId,
      messages: c2.messages
    }))
  );
  const profile = JSON.stringify(persistedState.profile || {});
  await memoryState.localCore.setUserData("v2_peers", peers);
  await memoryState.localCore.setUserData("v2_chats", chats);
  await memoryState.localCore.setUserData("v2_profile", profile);
}
var _saveTimer = null;
async function saveMetadataDebounced(delay = 300) {
  try {
    if (_saveTimer) clearTimeout(_saveTimer);
  } catch (error) {
    log.w("[STORAGE] Error clearing save timer:", error);
  }
  return new Promise((resolve) => {
    _saveTimer = setTimeout(async () => {
      _saveTimer = null;
      try {
        await saveMetadata();
      } finally {
        resolve();
      }
    }, delay);
  });
}
async function loadMetadata() {
  if (!memoryState.localCore) return;
  log.i("[STORAGE] Loading metadata from storage...");
  const peersStr = await memoryState.localCore.getUserData("v2_peers");
  const chatsStr = await memoryState.localCore.getUserData("v2_chats");
  const profileStr = await memoryState.localCore.getUserData("v2_profile");
  if (profileStr) {
    persistedState.profile = JSON.parse(profileStr.toString());
    log.i(`[STORAGE] Loaded user profile: ${persistedState.profile?.name || "NONE"}`);
  }
  if (peersStr) {
    const peers = JSON.parse(peersStr.toString());
    log.i(`[STORAGE] Loaded ${peers.length} peers`);
    for (const p of peers) {
      persistedState.peers.set(p.peerId, p);
      log.i(
        `[STORAGE] Peer ${p.peerId.slice(0, 8)}: profile.name=${p.profile?.name || "NONE"}`
      );
    }
  }
  if (chatsStr) {
    const chats = JSON.parse(chatsStr.toString());
    log.i(
      `[STORAGE] Loaded ${chats.length} chats with ${chats.reduce(
        (sum, c2) => sum + c2.messages.length,
        0
      )} total messages`
    );
    for (const c2 of chats) {
      persistedState.chats.set(c2.id, c2);
    }
  }
}

// backend/swarm.ts
import Hyperswarm from "hyperswarm";
import crypto from "hypercore-crypto";
import b4a2 from "b4a";
import Protomux from "protomux";
import c from "compact-encoding";

// backend/peers.ts
import b4a from "b4a";

// backend/events.ts
function send(eventType, payload) {
  if (!memoryState.rpc) return;
  const req = memoryState.rpc.request(eventType);
  req.send(Buffer.from(JSON.stringify(payload)));
}
function emitPeerConnected(peerId, chatId = null, profile = null) {
  send(RPC_PEER_CONNECTED, {
    type: "peer_connected",
    data: { peerId, chatId, profile, timestamp: Date.now() }
  });
}
function emitPeerDisconnected(peerId, error = null) {
  send(RPC_PEER_DISCONNECTED, {
    type: "peer_disconnected",
    data: { peerId, error, timestamp: Date.now() }
  });
}
function emitMessageReceived(message, chatId) {
  send(RPC_MESSAGE_RECEIVED, {
    type: "message_received",
    data: { message, chatId, timestamp: Date.now() }
  });
}
function emitError(error, context = "") {
  send(RPC_ERROR, {
    type: "error",
    data: { error: String(error), context, timestamp: Date.now() }
  });
}

// backend/peers.ts
function getSelfIdHex() {
  if (!persistedState.userKeyPair) {
    throw new Error("User keypair not initialized");
  }
  return b4a.toString(persistedState.userKeyPair.publicKey, "hex");
}
function deriveChatIdForPeer(peerIdHex) {
  const myId = getSelfIdHex();
  return myId < peerIdHex ? `${myId}:${peerIdHex}` : `${peerIdHex}:${myId}`;
}
async function registerConnection(peerIdHex, chatWriter) {
  const peer = getOrCreatePeer(peerIdHex);
  peer.lastSeen = Date.now();
  log.i("[PEERS] registerConnection for", peerIdHex);
  const chatId = deriveChatIdForPeer(peerIdHex);
  const chat = getOrCreateChat(chatId, peerIdHex);
  const transport = memoryState.peerTransports.get(peerIdHex);
  registerActiveConnection(peerIdHex, chatWriter, transport);
  return chatId;
}
function unregisterConnection(peerIdHex, error) {
  unregisterActiveConnection(peerIdHex);
  memoryState.peerTransports.delete(peerIdHex);
  log.i("[PEERS] unregisterConnection for", peerIdHex);
  emitPeerDisconnected(peerIdHex, error || null);
}
function getPeerStatus(peerIdHex) {
  return memoryState.activeConnections.has(peerIdHex) ? "connected" : "disconnected";
}

// backend/chat.ts
async function sendChatMessage(chatId, text, type = "text", metadata = {}) {
  const chat = persistedState.chats.get(chatId);
  if (!chat) throw new Error("chat not found");
  const message = {
    id: `${Date.now()}:${Math.random().toString(36).slice(2)}`,
    chatId,
    senderId: persistedState.userId,
    type,
    text,
    timestamp: Date.now(),
    status: "pending",
    ...metadata
  };
  chat.messages.push(message);
  try {
    await saveMetadataDebounced();
  } catch (error) {
    log.w("[CHAT] Failed to save metadata:", error);
  }
  try {
    emitMessageReceived(message, chatId);
  } catch (error) {
    log.w("[CHAT] emitMessageReceived failed", message.id);
  }
  log.i("[CHAT] send local append", message.id, "to", chat.peerId);
  const activeConn = getActiveConnection(chat.peerId);
  if (activeConn?.chatWriter) {
    try {
      activeConn.chatWriter.write(Buffer.from(JSON.stringify({ t: "msg", message })));
      message.status = "sent";
      log.i("[CHAT] send bytes ok for", message.id);
    } catch (err) {
      log.e("[CHAT] send failed", message.id, err);
      throw new Error("Failed to send message - peer offline");
    }
  } else {
    log.e("[CHAT] no connection for", chat.peerId);
    throw new Error("Cannot send message - peer not connected");
  }
  return { messageId: message.id };
}
async function handleIncomingChannelData(peerIdHex, data) {
  try {
    const msg = JSON.parse(
      Buffer.isBuffer(data) ? data.toString("utf8") : String(data)
    );
    if (msg.t === "msg" && msg.message) {
      const m = msg.message;
      const chatId = m.chatId || deriveChatIdForPeer(peerIdHex);
      const chat = getOrCreateChat(chatId, peerIdHex);
      const isDuplicate = chat.messages.some((existing) => existing.id === m.id);
      if (!isDuplicate) {
        chat.messages.push(m);
        try {
          await saveMetadataDebounced();
        } catch (error) {
          log.w("[CHAT] Failed to save metadata:", error);
        }
        emitMessageReceived(m, chatId);
        log.i("[CHAT] received message", m.id, "from", peerIdHex.slice(0, 16));
      } else {
        log.i("[CHAT] duplicate message ignored", m.id);
      }
    }
  } catch (error) {
    log.w("[CHAT] Error handling incoming data:", error);
  }
}
async function getChatMessages(chatId, limit = 50) {
  const chat = persistedState.chats.get(chatId);
  if (!chat) return [];
  const start = Math.max(0, chat.messages.length - limit);
  return chat.messages.slice(start);
}

// backend/swarm.ts
function topicFromChatId(chatId) {
  const h = crypto.hash(b4a2.from(chatId));
  return h.subarray(0, 32);
}
function topicFromPeerId(peerIdHex) {
  const h = crypto.hash(b4a2.from(`invite:${peerIdHex}`));
  return h.subarray(0, 32);
}
async function initSwarm() {
  if (memoryState.swarm) return memoryState.swarm;
  memoryState.swarm = new Hyperswarm();
  memoryState.swarm.on("connection", (conn, info) => {
    const remotePublicKey = info?.publicKey || conn.remotePublicKey;
    const candidateId = remotePublicKey ? b4a2.toString(remotePublicKey, "hex") : "unknown";
    log.i("[SWARM] connection: candidateId=", candidateId);
    const mux = new Protomux(conn);
    const chat = mux.createChannel({
      protocol: "whisper/chat/2",
      onclose: () => {
        log.i("[CHAT] close for", conn._remoteUserId || candidateId);
      }
    });
    const chatMessage = chat.addMessage({
      encoding: c.raw,
      onmessage: (buf) => {
        if (!conn._remoteUserId) return;
        log.i("[CHAT] message bytes len=", buf?.length, "from", conn._remoteUserId);
        handleIncomingChannelData(conn._remoteUserId, buf);
      }
    });
    const control = mux.createChannel({
      protocol: "whisper/control/2",
      handshake: c.json,
      onopen: async (remoteHandshake) => {
        try {
          log.i(
            "[CONTROL] Handshake complete with",
            remoteHandshake.userId,
            "profile:",
            !!remoteHandshake.profile
          );
          conn._remoteUserId = remoteHandshake.userId;
          const existingTransport = memoryState.peerTransports.get(
            remoteHandshake.userId
          );
          if (existingTransport && existingTransport !== conn) {
            const shouldKeepNewConnection = persistedState.userId > remoteHandshake.userId;
            if (shouldKeepNewConnection) {
              log.i(
                "[CONTROL] Replacing old outgoing with incoming from",
                remoteHandshake.userId.slice(0, 8),
                "(we have higher userId)"
              );
              try {
                existingTransport._isDuplicate = true;
                existingTransport.destroy();
              } catch (e) {
                log.w("[CONTROL] Failed to close old connection", e);
              }
              memoryState.peerTransports.set(remoteHandshake.userId, conn);
            } else {
              log.i(
                "[CONTROL] Keeping our outgoing, closing incoming from",
                remoteHandshake.userId.slice(0, 8),
                "(we have lower userId)"
              );
              conn._isDuplicate = true;
              try {
                conn.destroy();
              } catch (e) {
                log.w("[CONTROL] Failed to close duplicate", e);
              }
              return;
            }
          }
          const p = getOrCreatePeer(remoteHandshake.userId);
          if (remoteHandshake.profile) {
            p.profile = remoteHandshake.profile;
            log.i("[CONTROL] Profile saved:", remoteHandshake.profile);
          } else {
            log.w("[CONTROL] No profile in handshake from", remoteHandshake.userId);
          }
          try {
            await saveMetadata();
            log.i("[CONTROL] Metadata saved");
          } catch (e) {
            log.w("[CONTROL] Failed to save metadata", e);
          }
          log.i(
            "[CONTROL] Keeping invite discovery open for",
            remoteHandshake.userId.slice(0, 8),
            "as backup connection path"
          );
          const chatWriter = { write: (b) => chatMessage.send(b) };
          const chatId = await registerConnection(remoteHandshake.userId, chatWriter);
          memoryState.peerTransports.set(remoteHandshake.userId, conn);
          emitPeerConnected(remoteHandshake.userId, chatId, p.profile || {});
          log.i("[CONTROL] RPC_PEER_CONNECTED emitted with profile:", !!p.profile);
        } catch (e) {
          log.e("[CONTROL] Error in handshake handler:", e);
        }
      },
      onclose: () => {
        log.i("[CONTROL] close for", conn._remoteUserId || candidateId);
        if (!conn._isDuplicate) {
          unregisterConnection(conn._remoteUserId || candidateId);
        }
      }
    });
    log.i("[CONTROL] Opening control channel, sending handshake...");
    control.open({
      userId: persistedState.userId,
      profile: persistedState.profile
    });
    log.i("[CHAT] Opening chat channel...");
    chat.open();
  });
  return memoryState.swarm;
}
async function joinChat(chatId) {
  const existing = memoryState.chatDiscoveries.get(chatId);
  if (existing) {
    log.i(
      `[SWARM] Already joined chat topic for ${chatId.slice(0, 16)}, skipping...`
    );
    return existing;
  }
  if (!memoryState.swarm)
    throw new Error("Swarm not initialized - call onInit() first");
  const topic = topicFromChatId(chatId);
  log.i(`[SWARM] Joining NEW chat topic for ${chatId.slice(0, 16)}...`);
  const discovery = memoryState.swarm.join(topic, { client: true, server: true });
  memoryState.chatDiscoveries.set(chatId, discovery);
  log.i(`[SWARM] Waiting for DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Chat topic joined, listening for connections...`);
  return discovery;
}
async function joinInvite(peerIdHex) {
  const existing = memoryState.inviteDiscoveries.get(peerIdHex);
  if (existing) {
    log.i(
      `[SWARM] Already joined invite topic for ${peerIdHex.slice(0, 8)}, skipping...`
    );
    return existing;
  }
  if (!memoryState.swarm)
    throw new Error("Swarm not initialized - call onInit() first");
  const topic = topicFromPeerId(peerIdHex);
  log.i(`[SWARM] Joining invite topic for peer ${peerIdHex.slice(0, 8)}...`);
  const discovery = memoryState.swarm.join(topic, { client: true, server: true });
  log.i(`[SWARM] Waiting for invite DHT announce/lookup to complete...`);
  await discovery.flushed();
  log.i(`[SWARM] Invite topic joined, peer discovery active...`);
  memoryState.inviteDiscoveries.set(peerIdHex, discovery);
  return discovery;
}

// backend/qr.ts
import b4a3 from "b4a";
function encodeShareCode(publicKey) {
  return b4a3.toString(publicKey, "hex");
}
function decodeShareCode(shareCode) {
  return b4a3.from(shareCode, "hex");
}

// backend/index.ts
var { IPC } = BareKit;
var rpc = new RPC(IPC, async (req) => {
  try {
    const dataStr = req.data ? Buffer.isBuffer(req.data) ? req.data.toString("utf8") : String(req.data) : "{}";
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
        res = { success: false, error: "Unknown command" };
    }
    req.reply(Buffer.from(JSON.stringify(res)));
  } catch (e) {
    emitError(e, "rpc");
    req.reply(
      Buffer.from(JSON.stringify({ success: false, error: String(e) }))
    );
  }
});
memoryState.rpc = rpc;
async function onInit(data) {
  try {
    if (memoryState.initialized) {
      log.w(
        "[INIT] \u26A0\uFE0F Already initialized, returning existing userId:",
        persistedState.userId?.slice(0, 16)
      );
      return { success: true, userId: persistedState.userId || void 0 };
    }
    log.i("[INIT] \u{1F680} Starting fresh initialization...");
    const storagePath = data.storagePath || "./whisper-v2";
    log.i("[INIT] Storage path:", storagePath);
    await initializeStorage(storagePath);
    const pkCore = memoryState.corestore.get({ name: "keypair" });
    await pkCore.ready();
    let pub = await pkCore.getUserData("pub");
    let sec = await pkCore.getUserData("sec");
    if (!pub || !sec) {
      const kp = crypto2.keyPair();
      pub = kp.publicKey;
      sec = kp.secretKey;
      await pkCore.setUserData("pub", pub);
      await pkCore.setUserData("sec", sec);
    }
    persistedState.userKeyPair = { publicKey: pub, secretKey: sec };
    persistedState.userId = b4a4.toString(pub, "hex");
    await loadMetadata();
    await initSwarm();
    log.i("[INIT] Joining own invite topic");
    await joinInvite(persistedState.userId);
    const chatsList = Array.from(persistedState.chats.values());
    if (chatsList.length > 0) {
      log.i(`[INIT] Starting background join for ${chatsList.length} chat(s)...`);
      setImmediate(() => {
        log.i("[INIT-BG] Starting DHT lookup and hole punching for existing chats...");
        const joinPromises = chatsList.map(async (chat) => {
          try {
            log.i(`[INIT-BG] Joining invite topic for peer ${chat.peerId.slice(0, 8)}...`);
            await Promise.race([
              joinInvite(chat.peerId),
              new Promise(
                (_, reject) => setTimeout(() => reject(new Error("invite timeout")), 3e3)
              )
            ]);
            log.i(`[INIT-BG] \u2713 Joined invite for peer ${chat.peerId.slice(0, 8)}`);
            log.i(`[INIT-BG] Joining chat topic for ${chat.id.slice(0, 16)}...`);
            await Promise.race([
              joinChat(chat.id),
              new Promise(
                (_, reject) => setTimeout(() => reject(new Error("chat timeout")), 3e3)
              )
            ]);
            log.i(`[INIT-BG] \u2713 Joined chat ${chat.id.slice(0, 16)}`);
          } catch (e) {
            log.w(`[INIT-BG] \u2717 Failed to join chat ${chat.id.slice(0, 16)}: ${e.message}`);
          }
        });
        Promise.allSettled(joinPromises).then(() => {
          log.i("[INIT-BG] Background joins completed");
        });
      });
    }
    memoryState.initialized = true;
    log.i("[INIT] \u2705 Initialization complete! userId:", persistedState.userId?.slice(0, 16));
    return { success: true, userId: persistedState.userId };
  } catch (e) {
    log.e("[INIT] \u274C Critical initialization error:", e);
    memoryState.initialized = false;
    return { success: false, error: String(e) };
  }
}
async function onSetProfile(data) {
  persistedState.profile = { ...persistedState.profile, ...data };
  await saveMetadata();
  return { success: true, profile: persistedState.profile };
}
async function onGetProfile(data) {
  return {
    success: true,
    profile: persistedState.profile,
    userId: persistedState.userId || void 0
  };
}
async function onStartChatWithUser(data) {
  const { targetUserId } = data;
  if (!targetUserId) throw new Error("targetUserId required");
  const chatId = deriveChatIdForPeer(targetUserId);
  await joinInvite(targetUserId);
  await joinChat(chatId);
  getOrCreateChat(chatId, targetUserId);
  await saveMetadata();
  return { success: true, chatId };
}
async function onGetChatMessages(data) {
  const { chatId, limit } = data;
  if (!chatId) throw new Error("chatId required");
  const messages = await getChatMessages(chatId, limit ?? 50);
  return { success: true, messages };
}
async function onSendMessage(data) {
  const { chatId, text, type, ...metadata } = data;
  if (!chatId) throw new Error("chatId required");
  const r = await sendChatMessage(chatId, text || "", type || "text", metadata);
  await saveMetadata();
  return { success: true, messageId: r.messageId };
}
async function onConnectByShareCode(data) {
  const { shareCode } = data;
  if (!shareCode) throw new Error("shareCode required");
  const targetPubKey = decodeShareCode(shareCode);
  const peerId = b4a4.toString(targetPubKey, "hex");
  const chatId = deriveChatIdForPeer(peerId);
  log.i("[RPC] connectByShareCode peerId=", peerId, "chatId=", chatId);
  await joinInvite(peerId);
  await joinChat(chatId);
  getOrCreateChat(chatId, peerId);
  await saveMetadata();
  return { success: true, chatId, connectedTo: peerId };
}
async function onGetActiveChats() {
  const chats = getAllChats();
  return { success: true, chats };
}
async function onGeneratePublicInvite() {
  if (!persistedState.userKeyPair) throw new Error("User keypair not initialized");
  const shareCode = encodeShareCode(persistedState.userKeyPair.publicKey);
  return { success: true, shareCode };
}
async function onGetPeerStatus(data) {
  const { peerId } = data;
  if (!peerId) throw new Error("peerId required");
  return { success: true, status: getPeerStatus(peerId) };
}
async function onGetKnownPeers() {
  const peers = Array.from(persistedState.peers.values()).map((p) => ({
    userId: p.peerId,
    profile: p.profile || void 0,
    lastSeen: p.lastSeen || Date.now()
  }));
  return { success: true, peers };
}
async function onResetAllData() {
  log.i("[RESET] Starting comprehensive data reset...");
  log.i("[RESET] Current state summary:");
  log.i(`  - Peers: ${persistedState.peers.size}`);
  log.i(`  - Chats: ${persistedState.chats.size}`);
  log.i(`  - Invite discoveries: ${memoryState.inviteDiscoveries.size}`);
  log.i(`  - Storage path: ${memoryState.storagePath}`);
  try {
    if (memoryState.swarm) {
      log.i("[RESET] Destroying swarm connections and discoveries...");
      for (const conn of memoryState.swarm.connections) {
        try {
          conn.destroy();
        } catch {
        }
      }
      for (const discovery of memoryState.inviteDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {
        }
      }
      for (const discovery of memoryState.chatDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {
        }
      }
      try {
        await memoryState.swarm.destroy();
      } catch {
      }
      memoryState.swarm = null;
    }
    if (memoryState.localCore) {
      log.i("[RESET] Clearing corestore user data...");
      try {
        await memoryState.localCore.setUserData("v2_peers", "[]");
        await memoryState.localCore.setUserData("v2_chats", "[]");
        await memoryState.localCore.setUserData("pub", null);
        await memoryState.localCore.setUserData("sec", null);
        log.i("[RESET] Corestore user data cleared successfully");
      } catch (e) {
        log.w("[RESET] Error clearing corestore user data:", e);
      }
    }
    await closeStorage();
    if (memoryState.storagePath) {
      const fs = await import("bare-fs");
      const path = await import("bare-path");
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
        deleteDir(memoryState.storagePath);
      } catch {
      }
    }
    log.i("[RESET] Clearing all state...");
    clearAllState();
    memoryState.initialized = false;
    memoryState.storagePath = null;
    memoryState.corestore = null;
    memoryState.localCore = null;
    log.i("[RESET] All state cleared successfully");
    return { success: true, message: "All data reset successfully" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
async function onDestroy() {
  try {
    log.i("[DESTROY] Starting graceful shutdown...");
    if (memoryState.swarm) {
      log.i("[DESTROY] Closing swarm connections...");
      for (const conn of memoryState.swarm.connections) {
        try {
          conn.destroy();
        } catch {
        }
      }
      for (const discovery of memoryState.inviteDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {
        }
      }
      for (const discovery of memoryState.chatDiscoveries.values()) {
        try {
          await discovery.destroy();
        } catch {
        }
      }
      try {
        await memoryState.swarm.destroy();
      } catch {
      }
      memoryState.swarm = null;
      log.i("[DESTROY] Swarm closed");
    }
    log.i("[DESTROY] Closing storage...");
    await closeStorage();
    clearMemoryState();
    memoryState.rpc = null;
    memoryState.initialized = false;
    memoryState.corestore = null;
    memoryState.localCore = null;
    log.i("[DESTROY] \u2705 Shutdown complete");
    return { success: true };
  } catch (e) {
    log.e("[DESTROY] \u274C Error during shutdown:", e);
    return { success: false, error: String(e) };
  }
}
