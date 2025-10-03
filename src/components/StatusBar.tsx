import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';

interface StatusBarProps {
  isServerStarted: boolean;
  peerCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isServerStarted,
  peerCount,
}) => {
  const statusText = isServerStarted ? 'Connected' : 'Connecting...';

  return (
    <View style={styles.statusBar}>
      <Typography
        variant="caption"
        iconLeft={
          <View style={[styles.statusDot, isServerStarted && styles.statusOnline]} />
        }
      >
        {statusText}
      </Typography>
      <View style={styles.statusActions}>
        <Typography variant="caption" style={styles.peerCount}>
          {peerCount} peer{peerCount !== 1 ? 's' : ''}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  statusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  peerCount: {
    color: theme.colors.textSecondary,
  },
}));
