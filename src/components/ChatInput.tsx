import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage?: (text: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancelRecording?: () => void;
  disabled?: boolean;
  isRecording?: boolean;
  isProcessingVoice?: boolean;
}

const ChatInputComponent: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  disabled = false,
  isRecording = false,
  isProcessingVoice = false,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (isRecording) {
      onStopRecording?.();
    } else if (inputText.trim() && onSendMessage) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      onCancelRecording?.();
    } else {
      onStartRecording?.();
    }
  };
  const canSend = isRecording || inputText.trim();
  const isButtonDisabled = disabled || isProcessingVoice;

  return (
    <Animated.View
      style={styles.inputContainer}
      entering={FadeInDown.delay(100).duration(200)}
    >
      <View style={styles.floatingButtonsContainer}>
        <View style={styles.buttonContainer}>
          <Button
            variant="circular"
            size="medium"
            onPress={handleVoiceToggle}
            disabled={isButtonDisabled}
            style={[
              isRecording ? styles.voiceButtonRecording : styles.voiceButtonIdle,
            ]}
            icon={
              isProcessingVoice ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isRecording ? 'close' : 'mic'}
                  size={24}
                  color="#FFFFFF"
                />
              )
            }
          />
        </View>

        <View style={[styles.inputWrapper, disabled && styles.inputWrapperDisabled]}>
          <TextInput
            style={styles.textInput}
            placeholder={disabled ? 'Peer offline...' : 'Type a message...'}
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!disabled && !isRecording}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            variant="circular"
            onPress={handleSend}
            disabled={isButtonDisabled || !canSend}
            style={[
              styles.sendButton,
              isButtonDisabled || !canSend ? styles.sendButtonDisabled : {},
            ]}
            icon={
              <Ionicons name="send" size={20} color="#FFFFFF" />
            }
          />
        </View>
      </View>
    </Animated.View>
  );
};

export const ChatInput = React.memo(ChatInputComponent, (prevProps, nextProps) => {
  return (
    prevProps.disabled === nextProps.disabled &&
    prevProps.isRecording === nextProps.isRecording &&
    prevProps.isProcessingVoice === nextProps.isProcessingVoice
  );
});

const styles = StyleSheet.create((theme) => ({
  inputContainer: {},
  floatingButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  buttonContainer: {
    justifyContent: 'flex-end',
  },
  voiceButtonIdle: {
    backgroundColor: '#4CAF50',
  },
  voiceButtonRecording: {
    backgroundColor: '#F44336',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage,
  },
  textInput: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
  inputWrapperDisabled: {
    opacity: 0.5,
    borderColor: theme.colors.textSecondary,
  },
}));
