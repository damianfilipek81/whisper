import { useState, useCallback } from 'react';
import { useWhisperModel } from '@/hooks/useWhisperModel';
import {
  ChatVoiceSettingsStorage,
  WhisperModelType,
} from '@/services/storageService';
import { VoiceMessage } from '@/types';
import { SpeechToTextLanguage } from 'react-native-executorch';

interface UseVoiceMessageProps {
  chatId: string;
}

interface UseVoiceMessageReturn {
  processVoiceMessage: (audioData: Float32Array) => Promise<VoiceMessage | null>;
  isProcessing: boolean;
  isModelReady: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
}

export const useVoiceMessage = ({
  chatId,
}: UseVoiceMessageProps): UseVoiceMessageReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const settings = ChatVoiceSettingsStorage.getChatSettings(chatId);
  const { model, isReady, isDownloading, downloadProgress, error } = useWhisperModel({
    modelType: settings.whisperModel,
  });

  const processVoiceMessage = useCallback(
    async (audioData: Float32Array): Promise<VoiceMessage | null> => {
      if (!model.isReady || !audioData || audioData.length === 0) {
        console.log(
          '🔴 processVoiceMessage early return - model ready:',
          model.isReady,
          'audio length:',
          audioData?.length
        );
        return null;
      }

      try {
        console.log('🟢 processVoiceMessage starting');
        setIsProcessing(true);
        const duration = audioData.length / 16000;
        let transcription: string | undefined;
        let translation: string | undefined;

        if (settings.autoTranscribe) {
          const transcriptionResult = await model.transcribe(audioData, {
            language: settings.spokenLanguage as SpeechToTextLanguage,
          });
          transcription = transcriptionResult || undefined;
        }

        if (settings.autoTranslateToEnglish && settings.spokenLanguage !== 'en') {
          const translationResult = await model.transcribe(audioData, {
            language: 'en',
          });
          translation = translationResult || undefined;
        }

        const voiceMessage: VoiceMessage = {
          id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          audioData,
          duration,
          sampleRate: 16000,
          transcription,
          transcriptionLanguage: settings.spokenLanguage,
          translation,
          isProcessing: false,
          timestamp: Date.now(),
        };

        return voiceMessage;
      } catch (err) {
        console.error('Error processing voice message:', err);
        return null;
      } finally {
        console.log('🔵 processVoiceMessage finished, setting isProcessing to false');
        setIsProcessing(false);
      }
    },
    [model, settings]
  );

  return {
    processVoiceMessage,
    isProcessing,
    isModelReady: isReady,
    isDownloading,
    downloadProgress,
    error,
  };
};
