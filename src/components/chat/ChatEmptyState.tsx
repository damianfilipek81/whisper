import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';

interface ChatEmptyStateProps {
  peerName?: string;
}

const ChatEmptyStateComponent: React.FC<ChatEmptyStateProps> = ({ peerName }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="chatbubbles-outline" size={64} color="#9E9E9E" style={styles.icon} />
      <Typography variant="body" color="muted" style={styles.title}>
        No messages yet
      </Typography>
      <Typography variant="caption" color="muted" style={styles.subtitle}>
        Start a conversation with {peerName || 'this peer'}
      </Typography>
    </View>
  );
};

export const ChatEmptyState = React.memo(ChatEmptyStateComponent);

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  title: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
}));

