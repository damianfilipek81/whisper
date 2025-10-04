/**
 * Shared types for frontend (React Native) and backend (Bare)
 * These types define the contract between client and server
 */

// ============================================================================
// USER & PROFILE
// ============================================================================

export interface UserProfile {
  name?: string;
  createdAt?: number;
  [key: string]: any;
}

// ============================================================================
// PEER
// ============================================================================

export interface Peer {
  peerId: string;
  lastSeen: number;
  profile?: UserProfile;
}

export interface PeerStatus {
  peerId: string;
  connected: boolean;
  lastSeen: number;
  profile?: UserProfile;
}

// ============================================================================
// MESSAGE
// ============================================================================

export type MessageType = 'text' | 'voice';

export type MessageStatus = 'pending' | 'sent' | 'delivered';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  timestamp: number;
  status: MessageStatus;
  // Voice message metadata (optional)
  audioData?: string;
  transcription?: string;
  duration?: number;
  [key: string]: any;
}

// ============================================================================
// CHAT
// ============================================================================

export interface Chat {
  id: string;
  peerId: string;
  messages: Message[];
  lastMessageTime: number;
  unreadCount: number;
}

export interface ChatWithStatus extends Chat {
  peerConnected: boolean;
  peerProfile?: UserProfile;
}

// ============================================================================
// RPC REQUEST/RESPONSE TYPES
// ============================================================================

export interface RPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InitRequest {
  storagePath: string;
  publicKey: string;
  secretKey: string;
}

export interface InitResponse {
  userId: string;
  profile: UserProfile;
}

export interface SetUserProfileRequest {
  profile: UserProfile;
}

export interface GetUserProfileResponse {
  profile: UserProfile;
}

export interface StartChatRequest {
  peerId: string;
}

export interface StartChatResponse {
  chatId: string;
}

export interface GetChatMessagesRequest {
  chatId: string;
  limit?: number;
  before?: number;
}

export interface GetChatMessagesResponse {
  messages: Message[];
}

export interface SendMessageRequest {
  chatId: string;
  text: string;
  type?: MessageType;
  metadata?: Record<string, any>;
}

export interface SendMessageResponse {
  messageId: string;
  timestamp: number;
}

export interface ConnectByShareCodeRequest {
  shareCode: string;
}

export interface ConnectByShareCodeResponse {
  chatId: string;
  peerId: string;
}

export interface GetActiveChatsResponse {
  chats: ChatWithStatus[];
}

export interface GeneratePublicInviteResponse {
  inviteCode: string;
}

export interface GetPeerStatusRequest {
  peerId: string;
}

export interface GetPeerStatusResponse {
  status: PeerStatus;
}

export interface GetKnownPeersResponse {
  peers: Peer[];
}

// ============================================================================
// EVENTS (Backend → Frontend)
// ============================================================================

export interface PeerConnectedEvent {
  type: 'peer_connected';
  data: {
    peerId: string;
    chatId: string | null;
    profile: UserProfile | null;
    timestamp: number;
  };
}

export interface PeerDisconnectedEvent {
  type: 'peer_disconnected';
  data: {
    peerId: string;
    error: string | null;
    timestamp: number;
  };
}

export interface MessageReceivedEvent {
  type: 'message_received';
  data: {
    message: Message;
    chatId: string;
    timestamp: number;
  };
}

export interface PeerConnectingEvent {
  type: 'peer_connecting';
  data: {
    peerId: string;
    timestamp: number;
  };
}

export interface ErrorEvent {
  type: 'error';
  data: {
    error: string;
    context?: string;
    timestamp: number;
  };
}

export type RPCEvent =
  | PeerConnectedEvent
  | PeerDisconnectedEvent
  | MessageReceivedEvent
  | PeerConnectingEvent
  | ErrorEvent;
