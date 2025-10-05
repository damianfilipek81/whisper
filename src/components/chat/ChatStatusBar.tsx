import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';

interface ChatStatusBarProps {
  isConnected: boolean;
  isConnecting: boolean;
  isDownloadingModel?: boolean;
  modelDownloadProgress?: number;
  modelError?: string | null;
}

const ChatStatusBarComponent: React.FC<ChatStatusBarProps> = ({
  isConnected,
  isConnecting,
  isDownloadingModel = false,
  modelDownloadProgress = 0,
  modelError,
}) => {
  if (isDownloadingModel) {
    return (
      <View style={styles.container}>
        <View style={[styles.statusBar, styles.warningBar]}>
          <ActivityIndicator size="small" color="#FF9500" />
          <Typography variant="caption" color="muted" style={styles.statusText}>
            📥 Downloading Whisper model... {Math.round(modelDownloadProgress * 100)}%
          </Typography>
        </View>
      </View>
    );
  }

  if (modelError && !isDownloadingModel) {
    return (
      <View style={styles.container}>
        <View style={[styles.statusBar, styles.errorBar]}>
          <Typography variant="caption" color="muted">
            ⚠️ Voice message error: {modelError}
          </Typography>
        </View>
      </View>
    );
  }

  if (!isConnected && !isConnecting) {
    return (
      <View style={styles.container}>
        <View style={[styles.statusBar, styles.offlineBar]}>
          <Typography variant="caption" color="muted">
            🔴 Peer is offline - cannot send messages
          </Typography>
        </View>
      </View>
    );
  }

  if (isConnecting) {
    return (
      <View style={styles.container}>
        <View style={[styles.statusBar, styles.connectingBar]}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Typography variant="caption" color="muted" style={styles.statusText}>
            🔄 Connecting to peer...
          </Typography>
        </View>
      </View>
    );
  }

  return null;
};

export const ChatStatusBar = React.memo(ChatStatusBarComponent);

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  warningBar: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  errorBar: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  offlineBar: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.2)',
  },
  connectingBar: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  statusText: {
    flex: 1,
  },
}));
