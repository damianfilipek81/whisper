/**
 * State management for backend_typescript
 *
 * Split into two categories:
 * - persistedState: Data that survives app restart (saved to corestore)
 * - memoryState: Ephemeral runtime data (cleared on restart)
 */

import type {
  PersistedState,
  MemoryState,
  Chat,
  Peer,
  ChatWithStatus,
  ChatWriter,
  ActiveConnection,
} from './types.js';

/**
 * Persisted State - Saved to storage and restored on init
 */
export const persistedState: PersistedState = {
  userId: null,
  userKeyPair: null,
  profile: {},
  peers: new Map(),
  chats: new Map(),
};

/**
 * Memory State - Runtime only, cleared on restart
 */
export const memoryState: MemoryState = {
  // Infrastructure
  rpc: null,
  corestore: null,
  localCore: null,
  swarm: null,

  // Runtime flags
  initialized: false,
  storagePath: null,

  // Active DHT discoveries (need references for cleanup)
  inviteDiscoveries: new Map(),
  chatDiscoveries: new Map(),

  // Active connections (ephemeral)
  peerTransports: new Map(),
  activeConnections: new Map(),
};

/**
 * Clear all in-memory state (but keep persisted data)
 */
export function clearMemoryState(): void {
  memoryState.inviteDiscoveries.clear();
  memoryState.chatDiscoveries.clear();
  memoryState.peerTransports.clear();
  memoryState.activeConnections.clear();
}

/**
 * Clear ALL state (both persisted and memory)
 */
export function clearAllState(): void {
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
export function getOrCreateChat(chatId: string, peerId: string): Chat {
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
export function getOrCreatePeer(peerId: string): Peer {
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
export function getAllChats(): ChatWithStatus[] {
  return Array.from(persistedState.chats.values()).map((chat) => ({
    ...chat,
    connected: memoryState.activeConnections.has(chat.peerId),
  }));
}

/**
 * Register an active connection (memory only)
 */
export function registerActiveConnection(
  peerId: string,
  chatWriter: ChatWriter,
  transport: any
): void {
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
export function unregisterActiveConnection(peerId: string): void {
  memoryState.activeConnections.delete(peerId);
}

/**
 * Check if peer is connected (memory check)
 */
export function isPeerConnected(peerId: string): boolean {
  return memoryState.activeConnections.has(peerId);
}

/**
 * Get active connection for peer
 */
export function getActiveConnection(peerId: string): ActiveConnection | undefined {
  return memoryState.activeConnections.get(peerId);
}
