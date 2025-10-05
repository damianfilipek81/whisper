import React from 'react';
import { View, Alert, Clipboard, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SharePeerCardProps {
  discoveryKey?: string;
  qrData: string | null;
  style?: any;
}

export const SharePeerCard: React.FC<SharePeerCardProps> = ({
  discoveryKey,
  qrData,
  style,
}) => {
  const handleCopyKey = () => {
    if (!discoveryKey) {
      Alert.alert('Error', 'Discovery key not ready yet');
      return;
    }
    Clipboard.setString(discoveryKey);
    Alert.alert('Copied!', 'Your discovery key has been copied to clipboard');
  };

  const handleShareKey = () => {
    if (!discoveryKey) {
      Alert.alert('Error', 'Discovery key not ready yet');
      return;
    }
    Share.share({
      message: `Connect with me on Whisper P2P!\n\nMy discovery key:\n${discoveryKey}`,
      title: 'Whisper P2P Connection',
    });
  };

  return (
    <Card
      title="Share Your Code"
      subtitle="Let others scan this QR code to connect with you"
      style={style}
    >
      <View style={styles.qrContainer}>
        {qrData ? (
          <QRCode value={qrData} size={200} backgroundColor="white" color="black" />
        ) : (
          <View style={styles.loadingContainer}>
            <Typography variant="body" style={styles.loadingText}>
              Generating QR Code...
            </Typography>
          </View>
        )}
      </View>

      {discoveryKey && (
        <View style={styles.keyContainer}>
          <Typography variant="caption" style={styles.keyLabel}>
            Your Discovery Key:
          </Typography>
          <View style={styles.keyRow}>
            <Typography variant="caption" style={styles.keyText}>
              {discoveryKey}
            </Typography>
            <Button
              variant="ghost"
              onPress={handleCopyKey}
              style={styles.copyButton}
              icon={<Ionicons name="copy-outline" size={18} color="#007AFF" />}
            >
              <Typography variant="button">Copy</Typography>
            </Button>
          </View>
        </View>
      )}

      <Button
        onPress={handleShareKey}
        icon={<Ionicons name="share-outline" size={20} color="#FFFFFF" />}
      >
        <Typography variant="button" color="inverse">
          Share Key
        </Typography>
      </Button>
    </Card>
  );
};

const styles = StyleSheet.create((theme) => ({
  qrContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  loadingText: {
    color: theme.colors.textSecondary,
  },
  keyContainer: {
    marginBottom: theme.spacing.lg,
  },
  keyLabel: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  keyText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontFamily: 'monospace',
  },
  copyButton: {
    paddingHorizontal: theme.spacing.sm,
  },
}));
