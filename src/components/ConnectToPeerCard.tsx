import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';

interface ConnectToPeerCardProps {
  peerKey: string;
  onPeerKeyChange: (key: string) => void;
  onConnect: () => void;
  onScanQR: () => void;
  isConnecting: boolean;
  style?: any;
}

export const ConnectToPeerCard: React.FC<ConnectToPeerCardProps> = ({
  peerKey,
  onPeerKeyChange,
  onConnect,
  onScanQR,
  isConnecting,
  style,
}) => {
  return (
    <Card
      title="Connect to Peer"
      subtitle="Scan QR code or enter discovery key manually"
      style={style}
    >
      <Button
        variant="secondary"
        onPress={onScanQR}
        icon={<Ionicons name="camera-outline" size={24} color="#007AFF" />}
        style={styles.scanButton}
      >
        <Typography variant="button">Scan QR Code</Typography>
      </Button>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Typography variant="caption" style={styles.dividerText}>
          OR ENTER MANUALLY
        </Typography>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        variant="multiline"
        placeholder="Paste discovery key here..."
        value={peerKey}
        onChangeText={onPeerKeyChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Button
        onPress={onConnect}
        disabled={!peerKey.trim() || isConnecting}
        style={styles.connectButton}
      >
        <Typography variant="button" color="inverse">
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Typography>
      </Button>
    </Card>
  );
};

const styles = StyleSheet.create((theme) => ({
  scanButton: {
    marginBottom: theme.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.otherMessage,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  connectButton: {
    marginTop: theme.spacing.md,
  },
}));
