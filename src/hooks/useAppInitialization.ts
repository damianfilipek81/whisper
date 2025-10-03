import { useEffect, useState, useRef } from 'react';
import { pearsService } from '@/services/pearsService';

export const useAppInitialization = () => {
  // Always start with false for consistency - useEffect will update if already initialized
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    const initializeService = async () => {
      // Prevent double initialization during Fast Refresh
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

    // Cleanup on unmount (Fast Refresh, app close, etc.)
    return () => {
      console.log('🧹 Cleaning up pearsService...');
      // Note: We don't call destroy() here because it would break during Fast Refresh
      // Backend should stay alive across Fast Refreshes
      // Only destroy on actual app termination (handled by native lifecycle)
    };
  }, []);

  return {
    isInitialized,
  };
};
