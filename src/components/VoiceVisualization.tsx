import React from 'react';
import { View } from 'react-native';
import { VoiceBar } from './VoiceBar';

interface VoiceVisualizationProps {
  audioData: Uint8Array;
  barWidth: number;
}

export const VoiceVisualization: React.FC<VoiceVisualizationProps> = React.memo(
  ({ audioData, barWidth }) => {
    if (!audioData || audioData.length === 0) {
      return null;
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          height: 30,
        }}
      >
        {Array.from(audioData).map((value, index) => (
          <VoiceBar
            key={`voice-bar-${index}`}
            value={value}
            barId={`bar-${index}`}
            barWidth={barWidth}
          />
        ))}
      </View>
    );
  }
);
