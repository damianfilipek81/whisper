import b4a from 'b4a';
import { log } from './logger.js';
import {
  persistedState,
  memoryState,
  getOrCreatePeer,
  getOrCreateChat,
  registerActiveConnection,
  unregisterActiveConnection,
} from './state.js';
import { emitPeerDisconnected } from './events.js';
import type { ChatWriter } from './types.js';

export function getSelfIdHex(): string {
  if (!persistedState.userKeyPair) {
    throw new Error('User keypair not initialized');
  }
  return b4a.toString(persistedState.userKeyPair.publicKey, 'hex');
}

export function deriveChatIdForPeer(peerIdHex: string): string {
  const myId = getSelfIdHex();
  return myId < peerIdHex ? `${myId}:${peerIdHex}` : `${peerIdHex}:${myId}`;
}

export async function registerConnection(
  peerIdHex: string,
  chatWriter: ChatWriter
): Promise<string> {
  // Update persisted peer metadata
  const peer = getOrCreatePeer(peerIdHex);
  peer.lastSeen = Date.now();

  log.i('[PEERS] registerConnection for', peerIdHex);

  // Get/create chat
  const chatId = deriveChatIdForPeer(peerIdHex);
  const chat = getOrCreateChat(chatId, peerIdHex);

  // Register active connection in memory
  const transport = memoryState.peerTransports.get(peerIdHex);
  registerActiveConnection(peerIdHex, chatWriter, transport);

  return chatId;
}

export function unregisterConnection(peerIdHex: string, error?: string | null): void {
  // Remove from memory
  unregisterActiveConnection(peerIdHex);
  memoryState.peerTransports.delete(peerIdHex);

  log.i('[PEERS] unregisterConnection for', peerIdHex);

  // Emit disconnect event
  emitPeerDisconnected(peerIdHex, error || null);
}

export function getPeerStatus(peerIdHex: string): 'connected' | 'disconnected' {
  return memoryState.activeConnections.has(peerIdHex) ? 'connected' : 'disconnected';
}
