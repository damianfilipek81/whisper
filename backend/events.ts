import { memoryState } from './state.js';
import {
  RPC_PEER_CONNECTED,
  RPC_PEER_DISCONNECTED,
  RPC_MESSAGE_RECEIVED,
  RPC_PEER_CONNECTING,
  RPC_ERROR,
} from '../shared/constants.js';
import type { Message, UserProfile } from './types.js';

function send(eventType: number, payload: any): void {
  if (!memoryState.rpc) return;
  const req = memoryState.rpc.request(eventType);
  req.send(Buffer.from(JSON.stringify(payload)) as any);
}

export function emitPeerConnected(
  peerId: string,
  chatId: string | null = null,
  profile: UserProfile | null = null
): void {
  send(RPC_PEER_CONNECTED, {
    type: 'peer_connected',
    data: { peerId, chatId, profile, timestamp: Date.now() },
  });
}

export function emitPeerDisconnected(
  peerId: string,
  error: string | null = null
): void {
  send(RPC_PEER_DISCONNECTED, {
    type: 'peer_disconnected',
    data: { peerId, error, timestamp: Date.now() },
  });
}

export function emitMessageReceived(message: Message, chatId: string): void {
  send(RPC_MESSAGE_RECEIVED, {
    type: 'message_received',
    data: { message, chatId, timestamp: Date.now() },
  });
}

export function emitPeerConnecting(peerId: string): void {
  send(RPC_PEER_CONNECTING, {
    type: 'peer_connecting',
    data: { peerId, timestamp: Date.now() },
  });
}

export function emitError(error: Error | string, context: string = ''): void {
  send(RPC_ERROR, {
    type: 'error',
    data: { error: String(error), context, timestamp: Date.now() },
  });
}
