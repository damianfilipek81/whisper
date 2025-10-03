import { useState, useEffect, useCallback } from 'react';
import {
  useSpeechToText,
  WHISPER_TINY,
  WHISPER_BASE,
  WHISPER_SMALL,
} from 'react-native-executorch';
import { WhisperModelType } from '@/services/storageService';

interface UseWhisperModelProps {
  modelType: WhisperModelType;
}

interface UseWhisperModelReturn {
  model: ReturnType<typeof useSpeechToText>;
  isReady: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
}

const MODEL_MAP = {
  tiny: WHISPER_TINY,
  base: WHISPER_BASE,
  small: WHISPER_SMALL,
};

export const useWhisperModel = ({
  modelType,
}: UseWhisperModelProps): UseWhisperModelReturn => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const model = useSpeechToText({
    model: MODEL_MAP[modelType],
    onProgress: (progress) => {
      setIsDownloading(true);
      setDownloadProgress(progress);
      if (progress >= 1) {
        setIsDownloading(false);
      }
    },
  });

  return {
    model,
    isReady: model.isReady,
    isDownloading,
    downloadProgress,
    error: model.error || null,
  };
};

