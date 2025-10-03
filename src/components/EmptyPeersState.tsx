import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

interface EmptyPeersStateProps {
  onAddPeer: () => void;
}

export const EmptyPeersState: React.FC<EmptyPeersStateProps> = ({ onAddPeer }) => {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#9E9E9E" style={styles.icon} />
      <Typography variant="heading3" style={styles.emptyTitle}>
        No peers connected
      </Typography>
      <Typography variant="body" style={styles.emptySubtitle}>
        Add friends by sharing your peer key or scanning theirs
      </Typography>
      <Button
        onPress={onAddPeer}
        style={styles.addButton}
        icon={<Ionicons name="person-add" size={20} color="#FFFFFF" />}
      >
        <Typography variant="button" color="inverse">
          Add First Peer
        </Typography>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    minHeight: 300,
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  addButton: {
    paddingHorizontal: theme.spacing.xl,
  },
}));
