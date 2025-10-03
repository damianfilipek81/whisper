import { state } from './state.mjs';
import {
  RPC_PEER_CONNECTED,
  RPC_PEER_DISCONNECTED,
  RPC_MESSAGE_RECEIVED,
  RPC_PEER_CONNECTING,
  RPC_ERROR,
} from './constants.mjs';

function send(eventType, payload) {
  if (!state.rpc) return;
  const req = state.rpc.request(eventType);
  req.send(Buffer.from(JSON.stringify(payload)));
}

export function emitPeerConnected(peerId, chatId = null, profile = null) {
  send(RPC_PEER_CONNECTED, {
    type: 'peer_connected',
    data: { peerId, chatId, profile, timestamp: Date.now() },
  });
}

export function emitPeerDisconnected(peerId, error = null) {
  send(RPC_PEER_DISCONNECTED, {
    type: 'peer_disconnected',
    data: { peerId, error, timestamp: Date.now() },
  });
}

export function emitMessageReceived(message, chatId) {
  send(RPC_MESSAGE_RECEIVED, {
    type: 'message_received',
    data: { message, chatId, timestamp: Date.now() },
  });
}

export function emitPeerConnecting(peerId) {
  send(RPC_PEER_CONNECTING, {
    type: 'peer_connecting',
    data: { peerId, timestamp: Date.now() },
  });
}

export function emitError(error, context = '') {
  send(RPC_ERROR, {
    type: 'error',
    data: { error: String(error), context, timestamp: Date.now() },
  });
}
