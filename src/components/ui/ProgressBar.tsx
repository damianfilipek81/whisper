import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Typography } from './Typography';

interface ProgressBarProps {
  progress: number; // 0 to 1
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  height = 8,
  animated = true,
  color,
  backgroundColor,
}) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    if (animated) {
      progressValue.value = withSpring(clampedProgress, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      progressValue.value = clampedProgress;
    }
  }, [progress, animated]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={[styles.track(height, backgroundColor)]}>
        <Animated.View style={[styles.fill(height, color), progressStyle]} />
      </View>
      {showPercentage && (
        <Typography variant="caption" color="muted" style={styles.percentage}>
          {percentage}%
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  track: (height: number, bgColor?: string) => ({
    width: '100%',
    height,
    backgroundColor: bgColor || theme.colors.otherMessage,
    borderRadius: height / 2,
    overflow: 'hidden',
  }),
  fill: (height: number, fillColor?: string) => ({
    height,
    backgroundColor: fillColor || theme.colors.primary,
    borderRadius: height / 2,
  }),
  percentage: {
    textAlign: 'center',
    fontSize: 12,
  },
}));

