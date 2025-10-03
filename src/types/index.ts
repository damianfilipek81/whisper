export interface PeerMessage {
  id: string;
  fromPeerId: string;
  toPeerId: string;
  originalText: string;
  translatedText?: string;
  language: string;
  timestamp: number;
  type: 'text' | 'audio' | 'transcription' | 'voice';
  // Voice message specific fields
  audioData?: number[]; // Serialized Float32Array
  audioDuration?: number; // in seconds
  audioSampleRate?: number; // typically 16000 for Whisper
  transcription?: string;
  transcriptionLanguage?: string;
  translation?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface Conversation {
  chatId: string;
  peer: PeerConnection;
  lastMessage?: PeerMessage;
  unreadCount: number;
  lastActivity: number;
}

export interface ChatScreenProps {
  peer: PeerConnection;
  chatId: string;
  messages?: PeerMessage[]; // Optional since we load from backend
}

export interface PeerConnection {
  id: string;
  connected: boolean;
  name?: string;
  status?: 'connected' | 'disconnected' | 'connecting';
}

export interface VoiceMessage {
  id: string;
  audioData: Float32Array; // Raw audio waveform
  duration: number;
  sampleRate: number;
  transcription?: string;
  transcriptionLanguage?: string;
  translation?: string;
  isProcessing: boolean;
  timestamp: number;
}

// Backend data types
export interface BackendPeer {
  userId: string;
  profile?: {
    name?: string;
  };
  lastSeen: number;
}

export interface BackendChat {
  id: string;
  peerId: string;
  connected: boolean;
  lastMessage?: PeerMessage;
  unreadCount?: number;
  lastActivity?: number;
}

// Re-export QR types for easier access
export * from './qr.types';
