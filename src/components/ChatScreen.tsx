import React, { useCallback, useMemo, useState } from 'react';
import { View, StatusBar, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { PeerMessage } from '@/types';
import { VoiceTimeline } from '@/components/VoiceTimeline';
import { MessageBubble } from '@/components/MessageBubble';
import { VoiceMessageBubble } from '@/components/VoiceMessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatStatusBar } from '@/components/chat/ChatStatusBar';
import { ChatLoadingState } from '@/components/chat/ChatLoadingState';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { UserProfileStorage } from '@/services/storageService';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useChatConnection } from '@/hooks/useChatConnection';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useVoiceMessage } from '@/hooks/useVoiceMessage';
import { useAudioRecording } from '@/hooks/useAudioRecording';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const { rt } = useUnistyles();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { chatId, peer } = useRoute<RouteProp<RootStackParamList, 'Chat'>>().params;
  const keyboardHeight = useSharedValue(0);
  const [isRecording, setIsRecording] = useState(false);

  const { isInitialized } = useAppInitialization();
  const currentUserId = UserProfileStorage.getUserProfile()?.id;

  if (!currentUserId) {
    return <LoadingScreen message="Loading user profile..." />;
  }

  const {
    processVoiceMessage,
    isProcessing: isProcessingVoice,
    isDownloading,
    downloadProgress,
    error: modelError,
  } = useVoiceMessage({
    chatId,
  });

  const {
    audioData,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    startAudioUpdates,
    stopAudioUpdates,
  } = useAudioRecording();

  const {
    messages,
    sendMessage,
    isLoading: isLoadingMessages,
  } = useChatMessages({
    chatId,
    peerId: peer.id,
    currentUserId,
    isBackendReady: isInitialized,
  });

  const { isConnected, isConnecting } = useChatConnection({
    peerId: peer.id,
    initialConnected: peer.connected,
    initialStatus: peer.status,
  });

  useKeyboardHandler({
    onStart: (e) => {
      'worklet';
      keyboardHeight.value = withTiming(e.height, { duration: 100 });
    },
    onEnd: () => {
      'worklet';
      keyboardHeight.value = withTiming(0, { duration: 100 });
    },
  });

  const floatingInputAnimatedStyle = useAnimatedStyle(() => {
    const isKeyboardVisible = keyboardHeight.value > 0;

    return {
      paddingBottom: isKeyboardVisible ? rt.insets.bottom / 2 : rt.insets.bottom,
    };
  });

  const otherUser = useMemo(
    () => ({
      id: peer.id,
      name: peer.name || 'Unknown',
      isOnline: isConnected,
    }),
    [peer.id, peer.name, isConnected]
  );

  const contentContainerStyle = useMemo(
    () => [styles.messagesContent, { paddingTop: rt.insets.top + 60 }],
    [rt.insets.top]
  );

  const handleStartRecording = useCallback(async () => {
    await startAudioRecording();
    startAudioUpdates();
    setIsRecording(true);
  }, [startAudioRecording, startAudioUpdates]);

  const handleStopRecording = useCallback(async () => {
    stopAudioUpdates();
    setIsRecording(false);

    const recordedAudio = await stopAudioRecording();

    if (recordedAudio && recordedAudio.length > 0) {
      try {
        const voiceMessage = await processVoiceMessage(recordedAudio);

        if (voiceMessage) {
          console.log('🎤 Sending voice message:', {
            duration: voiceMessage.duration,
            audioLength: voiceMessage.audioData.length,
            transcription: voiceMessage.transcription?.substring(0, 50),
            translation: voiceMessage.translation?.substring(0, 50),
          });

          await sendMessage(voiceMessage.transcription || '', {
            type: 'voice',
            metadata: {
              audioData: Array.from(voiceMessage.audioData),
              audioDuration: voiceMessage.duration,
              audioSampleRate: voiceMessage.sampleRate,
              transcription: voiceMessage.transcription,
              transcriptionLanguage: voiceMessage.transcriptionLanguage,
              translation: voiceMessage.translation,
            },
          });
        } else {
          Alert.alert('Error', 'Failed to process voice message. Please try again.');
        }
      } catch (error) {
        console.error('Error processing voice message:', error);
        Alert.alert(
          'Error',
          'Failed to send voice message. Please check your connection and try again.'
        );
      }
    }
  }, [stopAudioRecording, stopAudioUpdates, processVoiceMessage, sendMessage]);

  const handleCancelRecording = useCallback(async () => {
    await stopAudioRecording();
    stopAudioUpdates();
    setIsRecording(false);
  }, [stopAudioRecording, stopAudioUpdates]);

  const renderMessage = useCallback(
    ({ item }: { item: PeerMessage }) => {
      const isCurrentUser = item.fromPeerId === currentUserId;
      const userName = isCurrentUser ? 'You' : peer.name || 'Unknown';

      if (item.type === 'voice') {
        return (
          <VoiceMessageBubble
            id={item.id}
            audioData={item.audioData}
            duration={item.audioDuration}
            transcription={item.transcription}
            transcriptionLanguage={item.transcriptionLanguage}
            translation={item.translation}
            timestamp={item.timestamp}
            userName={userName}
            isCurrentUser={isCurrentUser}
            userOnline={isConnected}
            isProcessing={false}
          />
        );
      }

      const text = item.originalText || item.translatedText || '[Message]';
      return (
        <MessageBubble
          id={item.id}
          text={text}
          timestamp={item.timestamp}
          userName={userName}
          userOnline={isConnected}
          isCurrentUser={isCurrentUser}
        />
      );
    },
    [currentUserId, peer.name, isConnected]
  );

  const handleOpenSettings = useCallback(() => {
    navigation.navigate('VoiceSettings', { chatId });
  }, [navigation, chatId]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={styles.container.backgroundColor}
      />
      <ChatHeader
        otherUser={otherUser}
        onBackPress={() => navigation.goBack()}
        onMorePress={handleOpenSettings}
      />
      <KeyboardAvoidingView
        behavior="position"
        contentContainerStyle={{ flex: 1 }}
        style={styles.keyboardContainer}
      >
        {isLoadingMessages ? (
          <ChatLoadingState />
        ) : messages.length === 0 ? (
          <ChatEmptyState peerName={peer.name} />
        ) : (
          <FlashList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
            maintainVisibleContentPosition={{
              autoscrollToBottomThreshold: 0.1,
              startRenderingFromBottom: true,
            }}
            removeClippedSubviews={true}
            getItemType={(item) =>
              `${item.fromPeerId === currentUserId ? 'user' : 'other'}-${item.type}`
            }
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        <Animated.View
          style={[styles.floatingInputContainer, floatingInputAnimatedStyle]}
        >
          <VoiceTimeline isRecording={isRecording} audioData={audioData} />

          <ChatStatusBar
            isConnected={isConnected}
            isConnecting={isConnecting}
            isDownloadingModel={isDownloading}
            modelDownloadProgress={downloadProgress}
            modelError={modelError}
          />

          <ChatInput
            onSendMessage={sendMessage}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCancelRecording={handleCancelRecording}
            disabled={!isConnected}
            isRecording={isRecording}
            isProcessingVoice={isProcessingVoice}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messagesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingBottom: 100,
  },
  floatingInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: rt.insets.bottom,
  },
}));
