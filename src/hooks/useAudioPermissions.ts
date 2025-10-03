import { useState, useCallback } from 'react';
import { AudioManager } from 'react-native-audio-api';
import type { PermissionStatus } from 'react-native-audio-api/src/system/types';

interface UseAudioPermissionsReturn {
  permissionStatus: PermissionStatus | null;
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;
  isPermissionGranted: boolean;
}

export const useAudioPermissions = (): UseAudioPermissionsReturn => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(
    null
  );

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const status = await AudioManager.requestRecordingPermissions();
      setPermissionStatus(status);
      return status === 'Granted';
    } catch (error) {
      setPermissionStatus('Denied');
      return false;
    }
  }, []);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const status = await AudioManager.checkRecordingPermissions();
      setPermissionStatus(status);
      return status === 'Granted';
    } catch (error) {
      setPermissionStatus('Denied');
      return false;
    }
  }, []);

  const isPermissionGranted = permissionStatus === 'Granted';

  return {
    permissionStatus,
    requestPermissions,
    checkPermissions,
    isPermissionGranted,
  };
};
