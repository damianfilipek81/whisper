/**
 * Type definitions for backend_typescript
 */

import type Hyperswarm from 'hyperswarm';
import type Corestore from 'corestore';
import type RPC from 'bare-rpc';
import type { Discovery } from 'hyperswarm';

// Import shared types that are common between frontend and backend
import type { UserProfile, Peer, Message, Chat, ChatWithStatus } from '../shared/types.js';

// Re-export for convenience
export type { Discovery };
// Re-export shared types for backward compatibility
export type { UserProfile, Peer, Message, Chat, ChatWithStatus };

export interface UserKeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
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
