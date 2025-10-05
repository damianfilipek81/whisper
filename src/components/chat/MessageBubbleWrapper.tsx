import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface MessageBubbleWrapperProps {
  isCurrentUser: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const MessageBubbleWrapper: React.FC<MessageBubbleWrapperProps> = ({
  isCurrentUser,
  children,
  style,
}) => {
  return (
    <View
      style={[
        styles.messageBubble,
        isCurrentUser ? styles.userBubble : styles.otherBubble,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  messageBubble: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: theme.colors.userMessage,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  otherBubble: {
    backgroundColor: theme.colors.otherMessage,
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
}));

