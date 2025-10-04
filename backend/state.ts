import type {
  PersistedState,
  MemoryState,
  Chat,
  Peer,
  ChatWithStatus,
  ChatWriter,
  ActiveConnection,
} from './types.js';

export const persistedState: PersistedState = {
  userId: null,
  userKeyPair: null,
  profile: {},
  peers: new Map(),
  chats: new Map(),
};

export const memoryState: MemoryState = {
  rpc: null,
  corestore: null,
  localCore: null,
  swarm: null,
  initialized: false,
  storagePath: null,
  inviteDiscoveries: new Map(),
  chatDiscoveries: new Map(),
  peerTransports: new Map(),
  activeConnections: new Map(),
};

export function clearMemoryState(): void {
  memoryState.inviteDiscoveries.clear();
  memoryState.chatDiscoveries.clear();
  memoryState.peerTransports.clear();
  memoryState.activeConnections.clear();
}

export function clearAllState(): void {
  persistedState.peers.clear();
  persistedState.chats.clear();
  persistedState.userId = null;
  persistedState.userKeyPair = null;
  persistedState.profile = {};
  clearMemoryState();
}

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

export function getAllChats(): ChatWithStatus[] {
  return Array.from(persistedState.chats.values()).map((chat) => {
    const peer = persistedState.peers.get(chat.peerId);
    return {
      ...chat,
      peerConnected: memoryState.activeConnections.has(chat.peerId),
      peerProfile: peer?.profile,
    };
  });
}

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

export function unregisterActiveConnection(peerId: string): void {
  memoryState.activeConnections.delete(peerId);
}

export function isPeerConnected(peerId: string): boolean {
  return memoryState.activeConnections.has(peerId);
}

export function getActiveConnection(peerId: string): ActiveConnection | undefined {
  return memoryState.activeConnections.get(peerId);
}
