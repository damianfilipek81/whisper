/**
 * In-memory state for backendv2 (persisted in corestore userData)
 */

export const state = {
  rpc: null,
  initialized: false,
  storagePath: null,
  userId: null,
  userKeyPair: null,
  profile: {},
  // storage
  corestore: null,
  localCore: null,
  // swarm + connections
  swarm: null,
  inviteDiscoveries: new Map(), // peerIdHex -> discovery
  // in-memory transport map (not persisted)
  peerTransports: new Map(), // peerId -> transport conn
  // maps
  peers: new Map(), // peerId -> { peerId, lastSeen, profile? }
  chats: new Map(), // chatId -> { id, peerId, messages: [], connected: boolean }
};

export function clearState() {
  state.peers.clear();
  state.chats.clear();
  state.inviteDiscoveries.clear();
  state.peerTransports.clear();
}

export function getOrCreateChat(chatId, peerId) {
  let chat = state.chats.get(chatId);
  if (!chat) {
    chat = { id: chatId, peerId, messages: [], connected: false };
    state.chats.set(chatId, chat);
  }
  return chat;
}

export function getOrCreatePeer(peerId) {
  let peer = state.peers.get(peerId);
  if (!peer) {
    peer = { peerId, lastSeen: Date.now() };
    state.peers.set(peerId, peer);
  }
  return peer;
}

export function getAllChats() {
  return Array.from(state.chats.values());
}
