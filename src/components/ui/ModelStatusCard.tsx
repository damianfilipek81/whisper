import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from './Typography';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

interface ModelStatusCardProps {
  isReady: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  onDownload: () => void;
}

export const ModelStatusCard: React.FC<ModelStatusCardProps> = ({
  isReady,
  isDownloading,
  downloadProgress,
  onDownload,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="bodyLarge" weight="bold">
          Model Status
        </Typography>
        <View style={styles.badge(isReady)}>
          <Typography
            variant="caption"
            weight="semibold"
            style={styles.badgeText(isReady)}
            iconLeft={
              <Ionicons
                name={
                  isReady
                    ? 'checkmark-circle'
                    : isDownloading
                    ? 'time'
                    : 'ellipse-outline'
                }
                size={16}
                color={isReady ? '#34C759' : '#FF9F0A'}
              />
            }
          >
            {isReady ? 'Ready' : isDownloading ? 'Downloading' : 'Not Ready'}
          </Typography>
        </View>
      </View>

      {isDownloading && (
        <View style={styles.downloadSection}>
          <Typography variant="body" color="muted" style={styles.downloadText}>
            Downloading model...
          </Typography>
          <ProgressBar progress={downloadProgress} showPercentage height={10} />
        </View>
      )}

      {!isReady && !isDownloading && (
        <Button
          variant="primary"
          size="small"
          onPress={onDownload}
          style={styles.downloadButton}
        >
          Download Model
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.cardBackground,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  badge: (isReady: boolean) => ({
    backgroundColor: isReady ? '#34C75920' : '#FF9F0A20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  }),
  badgeText: (isReady: boolean) => ({
    color: isReady ? '#34C759' : '#FF9F0A',
  }),
  downloadSection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  downloadText: {
    marginBottom: theme.spacing.xs,
  },
  downloadButton: {
    marginTop: theme.spacing.sm,
  },
}));

