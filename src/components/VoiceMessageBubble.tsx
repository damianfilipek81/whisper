import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useLayoutState } from '@shopify/flash-list';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { MessageContainer } from '@/components/chat/MessageContainer';
import { MessageBubbleWrapper } from '@/components/chat/MessageBubbleWrapper';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/utils/audioUtils';

interface VoiceMessageBubbleProps {
  id: string;
  audioData?: number[];
  duration?: number;
  transcription?: string;
  transcriptionLanguage?: string;
  translation?: string;
  timestamp: number;
  userName: string;
  isCurrentUser: boolean;
  userOnline?: boolean;
  isProcessing?: boolean;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  audioData,
  duration = 0,
  transcription,
  transcriptionLanguage,
  translation,
  timestamp,
  userName,
  isCurrentUser,
  userOnline = false,
  isProcessing = false,
}) => {
  // Use FlashList's useLayoutState for proper height management
  const [showTranscription, setShowTranscription] = useLayoutState(false);
  const [showTranslation, setShowTranslation] = useLayoutState(false);

  const audioPlayer = useAudioPlayer();

  // Animated values for smooth transitions (opacity only)
  const transcriptionOpacity = useSharedValue(0);
  const translationOpacity = useSharedValue(0);

  const toggleTranscription = () => {
    const newValue = !showTranscription;
    setShowTranscription(newValue);

    // Animate opacity for smooth transition
    transcriptionOpacity.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

  const toggleTranslation = () => {
    const newValue = !showTranslation;
    setShowTranslation(newValue);

    // Animate opacity for smooth transition
    translationOpacity.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

  const handlePlayPause = async () => {
    if (!audioData || audioData.length === 0) {
      console.warn('⚠️ No audio data available');
      return;
    }

    if (audioPlayer.isPlaying) {
      console.log('⏸️ Pausing audio');
      audioPlayer.pause();
    } else {
      console.log('▶️ Playing audio');
      await audioPlayer.play(audioData, 16000);
    }
  };

  // Animated styles for opacity only
  const transcriptionAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: transcriptionOpacity.value,
    };
  });

  const translationAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: translationOpacity.value,
    };
  });

  // Initialize opacity values based on initial state
  useEffect(() => {
    transcriptionOpacity.value = showTranscription ? 1 : 0;
    translationOpacity.value = showTranslation ? 1 : 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioPlayer.stop();
    };
  }, []);

  return (
    <MessageContainer
      isCurrentUser={isCurrentUser}
      userName={userName}
      userOnline={userOnline}
      timestamp={timestamp}
    >
      <MessageBubbleWrapper isCurrentUser={isCurrentUser}>
        <View style={styles.playerSection}>
          <Button
            variant="circular"
            size="small"
            onPress={handlePlayPause}
            disabled={!audioData || isProcessing || !audioData?.length}
            style={[
              styles.playButton,
              isCurrentUser ? styles.playButtonUser : styles.playButtonOther,
            ]}
            icon={
              isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={audioPlayer.isPlaying ? 'pause' : 'play'}
                  size={20}
                  color="#FFFFFF"
                />
              )
            }
          />

          <View style={styles.audioInfo}>
            <Typography
              variant="caption"
              color={isCurrentUser ? 'inverse' : 'muted'}
              weight="medium"
              iconLeft={
                <Ionicons
                  name="mic"
                  size={14}
                  color={isCurrentUser ? '#FFFFFF' : '#666666'}
                />
              }
            >
              Voice Message
            </Typography>
            <Typography variant="caption" color={isCurrentUser ? 'inverse' : 'muted'}>
              {audioPlayer.isPlaying
                ? formatDuration(audioPlayer.currentTime)
                : formatDuration(duration)}
            </Typography>
          </View>
        </View>

        {transcription && (
          <View style={styles.textSection}>
            <Button
              variant="ghost"
              size="small"
              onPress={toggleTranscription}
              style={styles.sectionToggle}
            >
              <View style={styles.sectionHeader}>
                <Typography
                  variant="caption"
                  weight="medium"
                  color={isCurrentUser ? 'inverse' : 'muted'}
                  iconLeft={
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={isCurrentUser ? '#FFFFFF' : '#666666'}
                    />
                  }
                >
                  {transcriptionLanguage?.toUpperCase() || 'Transcription'}
                </Typography>
                <Ionicons
                  name={showTranscription ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isCurrentUser ? '#FFFFFF' : '#666666'}
                />
              </View>
            </Button>
            {showTranscription && (
              <Animated.View style={transcriptionAnimatedStyle}>
                <Typography
                  variant="body"
                  color={isCurrentUser ? 'inverse' : 'primary'}
                  style={styles.textContent}
                >
                  {transcription}
                </Typography>
              </Animated.View>
            )}
          </View>
        )}

        {translation && (
          <View style={styles.textSection}>
            <Button
              variant="ghost"
              size="small"
              onPress={toggleTranslation}
              style={styles.sectionToggle}
            >
              <View style={styles.sectionHeader}>
                <Typography
                  variant="caption"
                  weight="medium"
                  color={isCurrentUser ? 'inverse' : 'muted'}
                  iconLeft={
                    <Ionicons
                      name="language-outline"
                      size={14}
                      color={isCurrentUser ? '#FFFFFF' : '#666666'}
                    />
                  }
                >
                  EN
                </Typography>
                <Ionicons
                  name={showTranslation ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isCurrentUser ? '#FFFFFF' : '#666666'}
                />
              </View>
            </Button>
            {showTranslation && (
              <Animated.View style={translationAnimatedStyle}>
                <Typography
                  variant="body"
                  color={isCurrentUser ? 'inverse' : 'primary'}
                  style={styles.textContent}
                >
                  {translation}
                </Typography>
              </Animated.View>
            )}
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator
              size="small"
              color={isCurrentUser ? '#FFFFFF' : '#007AFF'}
            />
            <Typography
              variant="caption"
              color={isCurrentUser ? 'inverse' : 'muted'}
              style={styles.processingText}
            >
              Processing...
            </Typography>
          </View>
        )}
      </MessageBubbleWrapper>
    </MessageContainer>
  );
};

const styles = StyleSheet.create((theme) => ({
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  playButton: {
    width: 36,
    height: 36,
    shadowOpacity: 0.2,
  },
  playButtonUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  playButtonOther: {
    backgroundColor: '#007AFF',
  },
  audioInfo: {
    flex: 1,
    gap: 2,
  },
  textSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionToggle: {
    padding: 0,
    paddingVertical: theme.spacing.xs,
    minHeight: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  textContent: {
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  processingText: {
    flex: 1,
  },
}));
