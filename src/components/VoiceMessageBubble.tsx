import React, { useEffect } from 'react';
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

const VoiceMessageBubbleComponent: React.FC<VoiceMessageBubbleProps> = ({
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
  const [showText, setShowText] = useLayoutState(false);
  const [activeTab, setActiveTab] = useLayoutState<'transcription' | 'translation'>(
    'transcription'
  );

  const audioPlayer = useAudioPlayer();

  const textOpacity = useSharedValue(0);

  const toggleText = () => {
    const newValue = !showText;
    setShowText(newValue);

    textOpacity.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

  const switchTab = (tab: 'transcription' | 'translation') => {
    if (!showText) {
      setShowText(true);
      textOpacity.value = withTiming(1, { duration: 300 });
    }
    setActiveTab(tab);
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

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  useEffect(() => {
    textOpacity.value = showText ? 1 : 0;
  }, []);

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

        {(transcription || translation) && (
          <View style={styles.textSection}>
            <View style={styles.tabContainer}>
              {transcription && (
                <Button
                  variant="ghost"
                  size="small"
                  onPress={() => switchTab('transcription')}
                  style={[
                    styles.tabButton,
                    activeTab === 'transcription' && styles.tabButtonActive,
                  ]}
                >
                  <View style={styles.sectionLabelContainer}>
                    <Ionicons
                      name="document-text"
                      size={14}
                      color={isCurrentUser ? '#FFFFFF' : '#666666'}
                    />
                    <Typography
                      variant="caption"
                      weight={activeTab === 'transcription' ? 'semibold' : 'medium'}
                      color={isCurrentUser ? 'inverse' : 'muted'}
                      style={styles.sectionLabel}
                    >
                      {transcriptionLanguage?.toUpperCase() || 'Transcription'}
                    </Typography>
                  </View>
                </Button>
              )}

              {translation && (
                <Button
                  variant="ghost"
                  size="small"
                  onPress={() => switchTab('translation')}
                  style={[
                    styles.tabButton,
                    activeTab === 'translation' && styles.tabButtonActive,
                  ]}
                >
                  <View style={styles.sectionLabelContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={isCurrentUser ? '#FFFFFF' : '#666666'}
                    />
                    <Typography
                      variant="caption"
                      weight={activeTab === 'translation' ? 'semibold' : 'medium'}
                      color={isCurrentUser ? 'inverse' : 'muted'}
                      style={styles.sectionLabel}
                    >
                      EN
                    </Typography>
                  </View>
                </Button>
              )}

              <Button
                variant="ghost"
                size="small"
                onPress={toggleText}
                style={styles.chevronButton}
              >
                <Ionicons
                  name={showText ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isCurrentUser ? '#FFFFFF' : '#666666'}
                />
              </Button>
            </View>

            {showText && (
              <Animated.View style={textAnimatedStyle}>
                <Typography
                  variant="body"
                  color={isCurrentUser ? 'inverse' : 'primary'}
                  style={styles.textContent}
                >
                  {activeTab === 'transcription' ? transcription : translation}
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
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tabButton: {
    padding: 0,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 0,
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  chevronButton: {
    padding: 0,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 0,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionLabel: {
    marginTop: 1,
  },
  textContent: {
    marginTop: theme.spacing.md,
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

export const VoiceMessageBubble = React.memo(VoiceMessageBubbleComponent);
