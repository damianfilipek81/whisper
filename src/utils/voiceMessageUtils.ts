import { VoiceMessage } from '@/types';
import { sanitizeForJSON } from '@/utils/rpcUtils';

export interface VoiceMessagePayload {
  text: string;
  type: 'voice';
  metadata: {
    audioData: number[];
    audioDuration: number;
    audioSampleRate: number;
    transcription?: string;
    transcriptionLanguage?: string;
    translation?: string;
  };
}

export const prepareVoiceMessageForSending = (
  voiceMessage: VoiceMessage
): VoiceMessagePayload => {
  return {
    text: voiceMessage.transcription ? sanitizeForJSON(voiceMessage.transcription) : '',
    type: 'voice',
    metadata: {
      audioData: Array.from(voiceMessage.audioData),
      audioDuration: voiceMessage.duration,
      audioSampleRate: voiceMessage.sampleRate,
      transcription: voiceMessage.transcription
        ? sanitizeForJSON(voiceMessage.transcription)
        : undefined,
      transcriptionLanguage: voiceMessage.transcriptionLanguage,
      translation: voiceMessage.translation
        ? sanitizeForJSON(voiceMessage.translation)
        : undefined,
    },
  };
};
