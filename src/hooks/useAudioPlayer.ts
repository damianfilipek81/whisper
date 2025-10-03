import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioContext, AudioBufferSourceNode } from 'react-native-audio-api';

interface UseAudioPlayerReturn {
  play: (audioData: number[], sampleRate?: number) => Promise<void>;
  pause: () => void;
  stop: () => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }

    return () => {
      stop();
      audioContextRef.current?.close();
    };
  }, []);

  const updateCurrentTime = useCallback(() => {
    if (audioContextRef.current && isPlaying && startTimeRef.current > 0) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(elapsed);

      if (elapsed < duration) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  }, [isPlaying, duration]);

  const play = useCallback(
    async (audioData: number[], sampleRate: number = 16000) => {
      try {
        console.log('🔊 Playing audio:', {
          length: audioData.length,
          sampleRate,
          duration: audioData.length / sampleRate,
        });

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate });
        }

        // Stop any currently playing audio
        stop();

        // Convert number array to Float32Array
        const float32Data = new Float32Array(audioData);
        const audioDuration = float32Data.length / sampleRate;
        setDuration(audioDuration);

        // Create audio buffer
        const audioBuffer = audioContextRef.current.createBuffer(
          1, // mono
          float32Data.length,
          sampleRate
        );

        // Copy audio data to buffer
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < float32Data.length; i++) {
          channelData[i] = float32Data[i];
        }

        // Create and configure source node
        const source = await audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        // Start playback
        startTimeRef.current = audioContextRef.current.currentTime;
        source.start();
        sourceNodeRef.current = source;
        setIsPlaying(true);
        setCurrentTime(0);

        // Start time update loop
        updateCurrentTime();

        // Handle playback end with timeout
        setTimeout(() => {
          console.log('🔊 Audio playback ended');
          setIsPlaying(false);
          setCurrentTime(0);
          sourceNodeRef.current = null;
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        }, audioDuration * 1000);

        console.log('✅ Audio playback started');
      } catch (error) {
        console.error('❌ Error playing audio:', error);
        setIsPlaying(false);
      }
    },
    [updateCurrentTime]
  );

  const pause = useCallback(() => {
    if (sourceNodeRef.current && isPlaying) {
      pauseTimeRef.current = audioContextRef.current?.currentTime || 0;
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      setIsPlaying(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    startTimeRef.current = 0;
    pauseTimeRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  return {
    play,
    pause,
    stop,
    isPlaying,
    currentTime,
    duration,
  };
};
