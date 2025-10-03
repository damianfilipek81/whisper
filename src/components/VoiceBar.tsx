import React from 'react';
import Animated from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

interface VoiceBarProps {
  value: number;
  barId: string;
  barWidth: number;
}

export const VoiceBar: React.FC<VoiceBarProps> = React.memo(({ value, barId, barWidth }) => {
  const { theme } = useUnistyles();

  const amplifiedValue = Math.min(255, value * 4 + 30);
  const barHeight = Math.max(3, Math.floor((amplifiedValue / 255) * 27));

  return (
    <Animated.View
      style={{
        height: barHeight,
        backgroundColor: amplifiedValue > 40 ? theme.colors.primary : '#666',
        width: barWidth,
        borderRadius: 1,
        minHeight: 2,
        opacity: 0.8,
      }}
    />
  );
});
