import React from 'react';
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
      subtitle="Enter a discovery key to connect or scan their QR code"
      style={style}
    >
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

      <Button
        variant="ghost"
        onPress={onScanQR}
        icon={<Ionicons name="camera-outline" size={20} color="#007AFF" />}
      >
        <Typography variant="button">Scan QR Code</Typography>
      </Button>
    </Card>
  );
};

const styles = StyleSheet.create((theme) => ({
  connectButton: {
    marginBottom: theme.spacing.md,
  },
}));
