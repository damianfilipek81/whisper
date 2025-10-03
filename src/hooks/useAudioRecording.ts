import { useState, useRef, useEffect } from 'react';
import {
  AudioContext,
  AnalyserNode,
  AudioRecorder,
  AudioManager,
  RecorderAdapterNode,
} from 'react-native-audio-api';
import type { PermissionStatus } from 'react-native-audio-api/src/system/types';
import { useAudioPermissions } from '@/hooks/useAudioPermissions';

const FFT_SIZE = 512;
const BAR_COUNT = 30;

interface UseAudioRecordingReturn {
  audioData: Uint8Array;
  audioChunks: Float32Array[];
  combinedAudio: Float32Array | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Float32Array | null>;
  startAudioUpdates: () => void;
  stopAudioUpdates: () => void;
  permissionStatus: PermissionStatus | null;
  isPermissionGranted: boolean;
}

interface UseAudioRecordingProps {
  onAudioData?: (audioData: Uint8Array) => void;
}

export const useAudioRecording = ({
  onAudioData,
}: UseAudioRecordingProps = {}): UseAudioRecordingReturn => {
  const [audioData, setAudioData] = useState<Uint8Array>(
    new Uint8Array(BAR_COUNT).fill(0)
  );
  const [combinedAudio, setCombinedAudio] = useState<Float32Array | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const adapterNodeRef = useRef<RecorderAdapterNode | null>(null);
  const audioUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);

  const { permissionStatus, requestPermissions, isPermissionGranted } =
    useAudioPermissions();

  const setupAudioAnalysis = async (): Promise<void> => {
    try {
      try {
        AudioManager.setAudioSessionOptions({
          iosCategory: 'playAndRecord',
          iosMode: 'spokenAudio',
          iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
        });
      } catch (audioManagerError) {}

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }

      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorder({
          sampleRate: 16000, // Whisper requires 16kHz
          bufferLengthInSamples: 1600,
        });

        audioRecorderRef.current.onAudioReady((event) => {
          if (event.numFrames > 0 && event.buffer) {
            const chunk = event.buffer.getChannelData(0);
            audioChunksRef.current.push(new Float32Array(chunk));
          }
        });
      }

      if (!adapterNodeRef.current) {
        adapterNodeRef.current = audioContextRef.current.createRecorderAdapter();
        audioRecorderRef.current.connect(adapterNodeRef.current);
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = FFT_SIZE;
        analyserRef.current.smoothingTimeConstant = 0.3;

        adapterNodeRef.current.connect(analyserRef.current);

        const silentGain = audioContextRef.current.createGain();
        silentGain.gain.value = 0;
        analyserRef.current.connect(silentGain);
        silentGain.connect(audioContextRef.current.destination);
      }

      audioRecorderRef.current.start();
    } catch (error) {}
  };

  const updateAudioData = (): void => {
    if (!analyserRef.current) {
      return;
    }

    const frequencyArrayLength = analyserRef.current.frequencyBinCount;
    const freqsArray = new Uint8Array(frequencyArrayLength);
    analyserRef.current.getByteFrequencyData(freqsArray);

    const downsampledData = new Uint8Array(BAR_COUNT);
    const samplesPerBar = Math.floor(frequencyArrayLength / BAR_COUNT);

    for (let i = 0; i < BAR_COUNT; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        const index = i * samplesPerBar + j;
        if (index < freqsArray.length) {
          sum += freqsArray[index];
        }
      }
      downsampledData[i] = Math.floor(sum / samplesPerBar);
    }

    setAudioData(downsampledData);
    onAudioData?.(downsampledData);
  };

  const startRecording = async (): Promise<void> => {
    audioChunksRef.current = [];
    setCombinedAudio(null);
    await setupAudioAnalysis();
  };

  const stopRecording = async (): Promise<Float32Array | null> => {
    try {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current.disconnect();
        audioRecorderRef.current = null;
      }

      if (adapterNodeRef.current) {
        adapterNodeRef.current.disconnect();
        adapterNodeRef.current = null;
      }

      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }

      setAudioData(new Uint8Array(BAR_COUNT).fill(0));

      // Wait to collect final chunks
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Combine all audio chunks
      const chunks = audioChunksRef.current;
      console.log('📊 Audio chunks collected:', chunks.length);

      if (chunks.length === 0) {
        console.log('⚠️ No audio chunks recorded');
        return null;
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      console.log('📊 Total audio length:', totalLength, 'samples');

      const waveform = new Float32Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        waveform.set(chunk, offset);
        offset += chunk.length;
      }

      setCombinedAudio(waveform);
      return waveform;
    } catch (error) {
      return null;
    }
  };

  const startAudioUpdates = (): void => {
    audioUpdateIntervalRef.current = setInterval(() => {
      updateAudioData();
    }, 1000 / 30);
  };

  const stopAudioUpdates = (): void => {
    if (audioUpdateIntervalRef.current) {
      clearInterval(audioUpdateIntervalRef.current);
      audioUpdateIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopAudioUpdates();
      stopRecording();
      audioContextRef.current?.close();
    };
  }, []);

  return {
    audioData,
    audioChunks: audioChunksRef.current,
    combinedAudio,
    startRecording,
    stopRecording,
    startAudioUpdates,
    stopAudioUpdates,
    permissionStatus,
    isPermissionGranted,
  };
};
