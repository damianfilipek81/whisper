import React from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ChatUser } from '@/types';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

interface ChatHeaderProps {
  otherUser?: ChatUser;
  onBackPress?: () => void;
  onMorePress?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  onBackPress,
  onMorePress,
}) => {
  const { rt } = useUnistyles();

  return (
    <View style={[styles.container, { paddingTop: rt.insets.top }]}>
      <View style={styles.headerContent}>
        <Button
          variant="circular"
          onPress={onBackPress}
          icon={<Ionicons name="chevron-back" size={24} color="#000000" />}
        />

        <View style={styles.centerContent}>
          {otherUser && (
            <View style={styles.userInfo}>
              <Typography variant="bodyLarge" weight="bold">
                {otherUser.name}
              </Typography>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: otherUser.isOnline ? '#4CAF50' : '#F44336' },
                ]}
              />
            </View>
          )}
        </View>

        <Button
          variant="circular"
          onPress={onMorePress}
          icon={<Ionicons name="settings-outline" size={24} color="#000000" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}));
