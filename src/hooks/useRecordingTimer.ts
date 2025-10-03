import { useState, useRef, useEffect, useCallback } from 'react';

interface UseRecordingTimerReturn {
  recordingTime: number;
  startTimer: () => void;
  stopTimer: () => void;
}

export const useRecordingTimer = (): UseRecordingTimerReturn => {
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setRecordingTime(0);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setRecordingTime(Math.floor(elapsed / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingTime(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return {
    recordingTime,
    startTimer,
    stopTimer,
  };
};
