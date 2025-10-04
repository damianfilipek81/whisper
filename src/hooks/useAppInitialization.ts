import { useEffect, useState, useRef } from 'react';
import { pearsService } from '@/services/pearsService';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    const initializeService = async () => {
      if (initializingRef.current) {
        console.log('⚠️ Already initializing, skipping...');
        return;
      }

      initializingRef.current = true;
      try {
        console.log('🚀 Initializing pearsService...');
        await pearsService.initialize();
        setIsInitialized(true);
        console.log('✅ pearsService initialized');
      } catch (error) {
        console.error('❌ Failed to initialize pearsService:', error);
        setIsInitialized(false);
      } finally {
        initializingRef.current = false;
      }
    };

    if (!pearsService.initialized) {
      initializeService();
    } else {
      setIsInitialized(true);
    }

    return () => {
      console.log('🧹 Cleaning up pearsService...');
    };
  }, []);

  return {
    isInitialized,
  };
};
