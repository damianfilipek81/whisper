import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRecordingTimer } from '@/hooks/useRecordingTimer';
import { VoiceVisualization } from '@/components/VoiceVisualization';
import { RecordingTimer } from '@/components/RecordingTimer';

interface VoiceTimelineProps {
  isRecording: boolean;
  audioData: Uint8Array;
}

const BAR_COUNT = 30;

export const VoiceTimeline: React.FC<VoiceTimelineProps> = ({
  isRecording,
  audioData,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const height = useSharedValue(0);

  const { rt } = useUnistyles();
  const screenWidth = rt.screen.width;
  const TIMELINE_WIDTH = Math.min(screenWidth - 100, 280);
  const BAR_WIDTH = Math.floor(TIMELINE_WIDTH / BAR_COUNT) - 1;

  const { recordingTime, startTimer, stopTimer } = useRecordingTimer();

  useEffect(() => {
    if (isRecording) {
      startTimer();
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      height.value = withTiming(60, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      height.value = withTiming(0, { duration: 200 });
      stopTimer();
    }
  }, [isRecording, startTimer, stopTimer]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      height: height.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.timelineContainer, animatedStyle]}>
      <View style={styles.timelineWrapper}>
        <VoiceVisualization audioData={audioData} barWidth={BAR_WIDTH} />
        <RecordingTimer recordingTime={recordingTime} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme) => ({
  timelineContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  timelineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}));
