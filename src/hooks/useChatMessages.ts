import { useState, useEffect, useCallback } from 'react';
import { PeerMessage } from '@/types';
import { pearsService } from '@/services/pearsService';
import { transformBackendMessageToPeerMessage, BackendMessage } from '@/utils/messageUtils';

interface UseChatMessagesProps {
  chatId: string;
  peerId: string;
  currentUserId: string;
  isBackendReady?: boolean;
}

interface SendMessageOptions {
  type?: 'text' | 'voice';
  metadata?: Record<string, any>;
}

interface UseChatMessagesReturn {
  messages: PeerMessage[];
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  isLoading: boolean;
}

export const useChatMessages = ({
  chatId,
  peerId,
  currentUserId,
  isBackendReady = true,
}: UseChatMessagesProps): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await pearsService.getChatMessages(chatId, 50);
        const backendMessages = (response.messages || []) as BackendMessage[];

        const peerMessages = backendMessages.map((msg) =>
          transformBackendMessageToPeerMessage(msg, currentUserId, peerId)
        );

        setMessages(peerMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isBackendReady && chatId) {
      loadMessages();
    }
  }, [chatId, currentUserId, peerId, isBackendReady]);

  useEffect(() => {
    const originalHandler = pearsService.onMessageReceived;

    pearsService.onMessageReceived = (message, messageChatId) => {
      if (messageChatId === chatId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            return prev;
          }

          const peerMessage = transformBackendMessageToPeerMessage(
            message as BackendMessage,
            currentUserId,
            peerId
          );

          return [...prev, peerMessage].sort((a, b) => a.timestamp - b.timestamp);
        });
      }

      originalHandler?.(message, messageChatId);
    };

    return () => {
      pearsService.onMessageReceived = originalHandler;
    };
  }, [chatId, currentUserId, peerId]);

  const sendMessage = useCallback(
    async (text: string, options?: SendMessageOptions) => {
      try {
        const { type = 'text', metadata = {} } = options || {};
        const response = await pearsService.sendMessage(chatId, text, type, metadata);
        if (!response.success) throw new Error('Failed to send message');
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [chatId]
  );

  return {
    messages,
    sendMessage,
    isLoading,
  };
};
