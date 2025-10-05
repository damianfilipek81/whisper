import { PeerMessage } from '@/types';

export interface BackendMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  type: 'text' | 'voice';
  // Voice message fields
  audioData?: number[];
  audioDuration?: number;
  audioSampleRate?: number;
  transcription?: string;
  transcriptionLanguage?: string;
  translation?: string;
  metadata?: Record<string, any>;
}

export const transformBackendMessageToPeerMessage = (
  backendMessage: BackendMessage,
  currentUserId: string,
  peerId: string
): PeerMessage => {
  const peerMessage: PeerMessage = {
    id: backendMessage.id,
    fromPeerId: backendMessage.senderId,
    toPeerId: backendMessage.senderId === currentUserId ? peerId : currentUserId,
    originalText: backendMessage.text,
    translatedText: backendMessage.text,
    language: 'en',
    timestamp: backendMessage.timestamp,
    type: backendMessage.type as 'text' | 'audio' | 'transcription' | 'voice',
  };

  if (backendMessage.type === 'voice') {
    peerMessage.audioData =
      backendMessage.audioData || backendMessage.metadata?.audioData;
    peerMessage.audioDuration =
      backendMessage.audioDuration || backendMessage.metadata?.audioDuration;
    peerMessage.audioSampleRate =
      backendMessage.audioSampleRate || backendMessage.metadata?.audioSampleRate;
    peerMessage.transcription =
      backendMessage.transcription || backendMessage.metadata?.transcription;
    peerMessage.transcriptionLanguage =
      backendMessage.transcriptionLanguage ||
      backendMessage.metadata?.transcriptionLanguage;
    peerMessage.translation =
      backendMessage.translation || backendMessage.metadata?.translation;
  }

  return peerMessage;
};
