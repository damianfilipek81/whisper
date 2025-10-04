/**
 * Type definitions for backend_typescript
 */

import type Hyperswarm from 'hyperswarm';
import type Corestore from 'corestore';
import type RPC from 'bare-rpc';
import type { Discovery } from 'hyperswarm';

// Re-export for convenience
export type { Discovery };

export interface UserKeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

export interface UserProfile {
  name?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface Peer {
  peerId: string;
  lastSeen: number;
  profile?: UserProfile;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'voice';
  text: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered';
  // Voice message metadata (optional)
  audioData?: string;
  transcription?: string;
  duration?: number;
  [key: string]: any;
}

export interface Chat {
  id: string;
  peerId: string;
  messages: Message[];
}

export interface ChatWithStatus extends Chat {
  connected: boolean;
}

export interface ActiveConnection {
  chatWriter: ChatWriter;
  transport: any;
  connected: boolean;
  connectedAt: number;
}

export interface ChatWriter {
  write: (buffer: Buffer) => void;
}

export interface PersistedState {
  userId: string | null;
  userKeyPair: UserKeyPair | null;
  profile: UserProfile;
  peers: Map<string, Peer>;
  chats: Map<string, Chat>;
}

export interface MemoryState {
  rpc: RPC | null;
  corestore: Corestore | null;
  localCore: any | null;
  swarm: Hyperswarm | null;
  initialized: boolean;
  storagePath: string | null;
  inviteDiscoveries: Map<string, Discovery>;
  chatDiscoveries: Map<string, Discovery>;
  peerTransports: Map<string, any>;
  activeConnections: Map<string, ActiveConnection>;
}

export interface RPCRequest {
  command: number;
  data: Buffer | string;
  reply: (data: Buffer) => void;
}

export interface RPCRequestData {
  storagePath?: string;
  targetUserId?: string;
  chatId?: string;
  limit?: number;
  text?: string;
  type?: string;
  shareCode?: string;
  peerId?: string;
  [key: string]: any;
}

export interface RPCResponse {
  success: boolean;
  error?: string;
  userId?: string;
  profile?: UserProfile;
  chatId?: string;
  messages?: Message[];
  messageId?: string;
  chats?: ChatWithStatus[];
  shareCode?: string;
  status?: string;
  peers?: any[];
  connectedTo?: string;
  message?: string;
}

export interface IncomingMessage {
  t: string;
  message?: Message;
}

export interface Handshake {
  userId: string;
  profile: UserProfile;
}
