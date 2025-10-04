export interface PeerMessage {
  id: string;
  fromPeerId: string;
  toPeerId: string;
  originalText: string;
  translatedText?: string;
  language: string;
  timestamp: number;
  type: 'text' | 'audio' | 'transcription' | 'voice';
  audioData?: number[];
  audioDuration?: number;
  audioSampleRate?: number;
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
  lastActivity: number;
}

export interface ChatScreenProps {
  peer: PeerConnection;
  chatId: string;
  messages?: PeerMessage[];
}

export interface PeerConnection {
  id: string;
  connected: boolean;
  name?: string;
  status?: 'connected' | 'disconnected' | 'connecting';
}

export interface VoiceMessage {
  id: string;
  audioData: Float32Array;
  duration: number;
  sampleRate: number;
  transcription?: string;
  transcriptionLanguage?: string;
  translation?: string;
  isProcessing: boolean;
  timestamp: number;
}
export type {
  UserProfile,
  Peer,
  Message,
  Chat,
  ChatWithStatus,
  MessageType,
  MessageStatus,
} from '../../shared/types';

export * from './qr.types';
