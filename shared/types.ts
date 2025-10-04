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
}

export interface ChatWithStatus extends Chat {
  peerConnected: boolean;
  peerProfile?: UserProfile;
}
