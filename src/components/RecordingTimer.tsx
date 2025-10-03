import React from 'react';
import { Text } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { formatRecordingTime } from '@/utils/dateUtils';

interface RecordingTimerProps {
  recordingTime: number;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = React.memo(
  ({ recordingTime }) => {
    const { theme } = useUnistyles();

    return (
      <Text
        style={{
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium,
          textAlign: 'center',
          minWidth: 40,
          color: theme.colors.primary,
        }}
      >
        {formatRecordingTime(recordingTime)}
      </Text>
    );
  }
);
