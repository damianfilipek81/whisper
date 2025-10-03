import b4a from 'b4a';
import crypto from 'hypercore-crypto';
import { log } from './logger.mjs';

import { state, getOrCreatePeer, getOrCreateChat } from './state.mjs';
import { emitPeerDisconnected } from './events.mjs';

export function getSelfIdHex() {
  return b4a.toString(state.userKeyPair.publicKey, 'hex');
}

export function deriveChatIdForPeer(peerIdHex) {
  const myId = getSelfIdHex();
  return myId < peerIdHex ? `${myId}:${peerIdHex}` : `${peerIdHex}:${myId}`;
}

export async function registerConnection(peerIdHex, conn) {
  const peer = getOrCreatePeer(peerIdHex);
  peer.lastSeen = Date.now();
  peer.conn = conn;
  
  log.i('[PEERS] registerConnection for', peerIdHex);

  const chatId = deriveChatIdForPeer(peerIdHex);
  // Use getOrCreateChat from state.mjs for consistency
  const chat = getOrCreateChat(chatId, peerIdHex);
  chat.connected = true; // Mark as connected when peer actually connects
  
  return chatId; // Return chatId for use in swarm.mjs
}

export function unregisterConnection(peerIdHex, error) {
  const peer = state.peers.get(peerIdHex);
  if (peer) delete peer.conn;
  // Also clear tracked transport
  state.peerTransports.delete(peerIdHex);
  log.i('[PEERS] unregisterConnection for', peerIdHex);
  const chatId = deriveChatIdForPeer(peerIdHex);
  const chat = state.chats.get(chatId);
  if (chat) chat.connected = false;
  emitPeerDisconnected(peerIdHex, error);
}

export function getPeerStatus(peerIdHex) {
  const peer = state.peers.get(peerIdHex);
  return peer && peer.conn ? 'connected' : 'disconnected';
}
