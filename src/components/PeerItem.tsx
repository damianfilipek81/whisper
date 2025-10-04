import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';
import { PeerConnection } from '@/types';

interface PeerItemProps {
  peer: PeerConnection;
  onPress: (peer: PeerConnection) => void;
}

export const PeerItem: React.FC<PeerItemProps> = ({ peer, onPress }) => {
  const getStatusText = () => {
    if (peer.status === 'connected' || peer.connected) return 'Connected';
    if (peer.status === 'disconnected') return 'Disconnected';
    return 'Connecting...';
  };

  const getStatusStyle = () => {
    if (peer.status === 'connecting') return styles.statusConnecting;
    if (peer.connected || peer.status === 'connected') return styles.statusConnected;
    return styles.peerStatus;
  };

  return (
    <TouchableOpacity style={styles.peerItem} onPress={() => onPress(peer)}>
      <View style={styles.peerInfo}>
        <View style={[styles.statusDot, peer.connected && styles.statusOnline]} />
        <View style={styles.peerDetails}>
          <Typography variant="body" weight="medium">
            {peer.name}
          </Typography>
          <Typography variant="caption" style={getStatusStyle()}>
            {getStatusText()}
          </Typography>
        </View>
      </View>
      {peer.status === 'connecting' && (
        <ActivityIndicator size="small" color="#FF9800" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  peerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  peerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  peerDetails: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  peerStatus: {
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusConnected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  statusConnecting: {
    color: '#FF9800',
    fontWeight: '500',
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
}));
