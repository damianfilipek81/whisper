import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';
import { formatTime } from '@/utils/dateUtils';

interface MessageContainerProps {
  isCurrentUser: boolean;
  userName: string;
  userOnline?: boolean;
  timestamp: number;
  children: React.ReactNode;
}

export const MessageContainer: React.FC<MessageContainerProps> = ({
  isCurrentUser,
  userName,
  userOnline = false,
  timestamp,
  children,
}) => {
  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.userMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!isCurrentUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Typography variant="caption" weight="bold" color="inverse">
              {userName.charAt(0).toUpperCase()}
            </Typography>
            {userOnline && <View style={styles.onlineIndicator} />}
          </View>
        </View>
      )}

      <View style={styles.messageContent}>
        {!isCurrentUser && (
          <Typography variant="caption" color="secondary" style={styles.senderName}>
            {userName}
          </Typography>
        )}
        
        {children}
        
        <Typography
          variant="caption"
          color="muted"
          style={[
            styles.timestamp,
            isCurrentUser ? styles.timestampUser : styles.timestampOther,
          ]}
        >
          {formatTime(timestamp)}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: theme.spacing.xs,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: theme.colors.secondary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.online,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  timestampUser: {
    textAlign: 'right',
  },
  timestampOther: {
    textAlign: 'left',
  },
}));
