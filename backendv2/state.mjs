/**
 * State management for backendv2
 *
 * Split into two categories:
 * - persistedState: Data that survives app restart (saved to corestore)
 * - memoryState: Ephemeral runtime data (cleared on restart)
 */

/**
 * Persisted State - Saved to storage and restored on init
 */
export const persistedState = {
  userId: null, // User's public key (hex)
  userKeyPair: null, // { publicKey, secretKey }
  profile: {}, // { name, createdAt, ... }
  peers: new Map(), // peerId -> { peerId, lastSeen, profile }
  chats: new Map(), // chatId -> { id, peerId, messages: [] }
};

/**
 * Memory State - Runtime only, cleared on restart
 */
export const memoryState = {
  // Infrastructure
  rpc: null,
  corestore: null,
  localCore: null,
  swarm: null,

  // Runtime flags
  initialized: false,
  storagePath: null,

  // Active DHT discoveries (need references for cleanup)
  inviteDiscoveries: new Map(), // peerId -> Discovery object
  chatDiscoveries: new Map(), // chatId -> Discovery object

  // Active connections (ephemeral)
  peerTransports: new Map(), // peerId -> TCP connection (for deduplication)
  activeConnections: new Map(), // peerId -> { transport, chatWriter, connected: true }
};

/**
 * Clear all in-memory state (but keep persisted data)
 */
export function clearMemoryState() {
  memoryState.inviteDiscoveries.clear();
  memoryState.chatDiscoveries.clear();
  memoryState.peerTransports.clear();
  memoryState.activeConnections.clear();
}

/**
 * Clear ALL state (both persisted and memory)
 */
export function clearAllState() {
  // Clear persisted
  persistedState.peers.clear();
  persistedState.chats.clear();
  persistedState.userId = null;
  persistedState.userKeyPair = null;
  persistedState.profile = {};

  // Clear memory
  clearMemoryState();
}

/**
 * Get or create a chat
 */
export function getOrCreateChat(chatId, peerId) {
  let chat = persistedState.chats.get(chatId);
  if (!chat) {
    chat = {
      id: chatId,
      peerId,
      messages: [],
    };
    persistedState.chats.set(chatId, chat);
  }
  return chat;
}

/**
 * Get or create a peer (persisted metadata only)
 */
export function getOrCreatePeer(peerId) {
  let peer = persistedState.peers.get(peerId);
  if (!peer) {
    peer = {
      peerId,
      lastSeen: Date.now(),
    };
    persistedState.peers.set(peerId, peer);
  }
  return peer;
}

/**
 * Get all chats (with connected status from memory)
 */
export function getAllChats() {
  return Array.from(persistedState.chats.values()).map((chat) => ({
    ...chat,
    connected: memoryState.activeConnections.has(chat.peerId),
  }));
}

/**
 * Register an active connection (memory only)
 */
export function registerActiveConnection(peerId, chatWriter, transport) {
  memoryState.activeConnections.set(peerId, {
    chatWriter,
    transport,
    connected: true,
    connectedAt: Date.now(),
  });
}

/**
 * Unregister an active connection (memory only)
 */
export function unregisterActiveConnection(peerId) {
  memoryState.activeConnections.delete(peerId);
}

/**
 * Check if peer is connected (memory check)
 */
export function isPeerConnected(peerId) {
  return memoryState.activeConnections.has(peerId);
}

/**
 * Get active connection for peer
 */
export function getActiveConnection(peerId) {
  return memoryState.activeConnections.get(peerId);
}
