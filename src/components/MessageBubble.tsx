import React from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';
import { MessageContainer } from '@/components/chat/MessageContainer';
import { MessageBubbleWrapper } from '@/components/chat/MessageBubbleWrapper';

interface MessageBubbleProps {
  id: string;
  text: string;
  timestamp: number;
  userName: string;
  userOnline: boolean;
  isCurrentUser: boolean;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  id,
  text,
  timestamp,
  userName,
  userOnline,
  isCurrentUser,
}) => {
  return (
    <MessageContainer
      isCurrentUser={isCurrentUser}
      userName={userName}
      userOnline={userOnline}
      timestamp={timestamp}
    >
      <MessageBubbleWrapper isCurrentUser={isCurrentUser}>
        <Typography
          variant="body"
          color={isCurrentUser ? 'inverse' : 'primary'}
          style={styles.messageText}
        >
          {text}
        </Typography>
      </MessageBubbleWrapper>
    </MessageContainer>
  );
};

export const MessageBubble = React.memo(MessageBubbleComponent);

const styles = StyleSheet.create(() => ({
  messageText: {
    lineHeight: 20,
  },
}));
