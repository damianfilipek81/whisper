import { useState, useEffect, useCallback } from 'react';
import { PeerMessage } from '@/types';
import { pearsService } from '@/services/pearsService';

interface UseChatMessagesProps {
  chatId: string;
  peerId: string;
  currentUserId: string;
  isBackendReady?: boolean; // Optional for backward compatibility
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
        const backendMessages = response.messages || [];

        const peerMessages: PeerMessage[] = backendMessages.map((msg) => {
          if (msg.type === 'voice') {
            console.log('📥 Loading voice message from backend:', {
              id: msg.id,
              duration: msg.audioDuration,
              audioDataLength: msg.audioData?.length,
              hasTranscription: !!msg.transcription,
              hasTranslation: !!msg.translation,
              hasMetadata: !!msg.metadata,
              metadataKeys: msg.metadata ? Object.keys(msg.metadata) : [],
              transcriptionValue: msg.transcription || msg.metadata?.transcription,
              translationValue: msg.translation || msg.metadata?.translation,
            });
          }

          return {
            id: msg.id,
            fromPeerId: msg.senderId,
            toPeerId: msg.senderId === currentUserId ? peerId : currentUserId,
            originalText: msg.text,
            translatedText: msg.text,
            language: 'en',
            timestamp: msg.timestamp,
            type: msg.type as 'text' | 'audio' | 'transcription' | 'voice',
            // Voice message specific fields
            audioData: msg.audioData || msg.metadata?.audioData,
            audioDuration: msg.audioDuration || msg.metadata?.audioDuration,
            audioSampleRate: msg.audioSampleRate || msg.metadata?.audioSampleRate,
            transcription: msg.transcription || msg.metadata?.transcription,
            transcriptionLanguage:
              msg.transcriptionLanguage || msg.metadata?.transcriptionLanguage,
            translation: msg.translation || msg.metadata?.translation,
          };
        });

        setMessages(peerMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for backend to be ready before loading messages
    if (isBackendReady && chatId) {
      loadMessages();
    }
  }, [chatId, currentUserId, peerId, isBackendReady]);

  // Listen for new messages
  useEffect(() => {
    const originalHandler = pearsService.onMessageReceived;

    pearsService.onMessageReceived = (message, messageChatId) => {
      if (messageChatId === chatId) {
        console.log('📨 New message received in chat:', chatId);
        console.log('   Type:', message.type);
        console.log('   Text:', message.text?.substring(0, 50));

        if (message.type === 'voice') {
          console.log('🎤 Voice message received:', {
            duration: message.audioDuration,
            audioDataLength: message.audioData?.length,
            hasTranscription: !!message.transcription,
            hasTranslation: !!message.translation,
          });
        }

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }

          const peerMessage: PeerMessage = {
            id: message.id,
            fromPeerId: message.senderId,
            toPeerId: message.senderId === currentUserId ? peerId : currentUserId,
            originalText: message.text,
            translatedText: message.text,
            language: 'en',
            timestamp: message.timestamp,
            type: message.type as 'text' | 'audio' | 'transcription' | 'voice',
            // Voice message specific fields
            audioData: message.audioData,
            audioDuration: message.audioDuration,
            audioSampleRate: message.audioSampleRate,
            transcription: message.transcription,
            transcriptionLanguage: message.transcriptionLanguage,
            translation: message.translation,
          };

          console.log('✅ Message added to state');
          return [...prev, peerMessage].sort((a, b) => a.timestamp - b.timestamp);
        });
      }

      originalHandler?.(message, messageChatId);
    };

    return () => {
      console.log(
        ` useChatMessages: Cleaning up message handler for chat: ${chatId}`
      );
      pearsService.onMessageReceived = originalHandler;
    };
  }, [chatId, currentUserId, peerId]);

  const sendMessage = useCallback(
    async (text: string, options?: SendMessageOptions) => {
      try {
        const { type = 'text', metadata = {} } = options || {};
        const response = await pearsService.sendMessage(chatId, text, type, metadata);
        if (response.success) {
          console.log(`${type} message sent successfully:`, response.messageId);
        } else {
          console.error('Failed to send message');
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        throw error; // Re-throw so caller can handle it
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
