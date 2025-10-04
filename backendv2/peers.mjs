import b4a from 'b4a';
import { log } from './logger.mjs';

import { 
  persistedState, 
  memoryState,
  getOrCreatePeer, 
  getOrCreateChat,
  registerActiveConnection,
  unregisterActiveConnection
} from './state.mjs';
import { emitPeerDisconnected } from './events.mjs';

export function getSelfIdHex() {
  return b4a.toString(persistedState.userKeyPair.publicKey, 'hex');
}

export function deriveChatIdForPeer(peerIdHex) {
  const myId = getSelfIdHex();
  return myId < peerIdHex ? `${myId}:${peerIdHex}` : `${peerIdHex}:${myId}`;
}

export async function registerConnection(peerIdHex, chatWriter) {
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

export function unregisterConnection(peerIdHex, error) {
  // Remove from memory
  unregisterActiveConnection(peerIdHex);
  memoryState.peerTransports.delete(peerIdHex);
  
  log.i('[PEERS] unregisterConnection for', peerIdHex);
  
  // Emit disconnect event
  emitPeerDisconnected(peerIdHex, error);
}

export function getPeerStatus(peerIdHex) {
  return memoryState.activeConnections.has(peerIdHex) ? 'connected' : 'disconnected';
}
