import { useState, useCallback } from 'react';
import { Conversation, PeerConnection, ChatWithStatus, Peer } from '@/types';
import { pearsService } from '@/services/pearsService';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const response = await pearsService.getActiveChats();
      const chats = response.chats || [];

      const peersResponse = await pearsService.getKnownPeers();
      const knownPeers = peersResponse.peers || [];

      const conversationsFromChats = createConversationsFromChats(chats, knownPeers);
      setConversations(conversationsFromChats);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversationsFromChats = useCallback(
    (chats: ChatWithStatus[], knownPeers: Peer[]): Conversation[] => {
      const conversations: Conversation[] = [];

      chats.forEach((chat) => {
        const peerId = chat.peerId;
        if (!peerId) return;

        const peerData = knownPeers.find((p) => p.peerId === peerId);
        const peerProfile = chat.peerProfile || peerData?.profile;

        const peerConnection: PeerConnection = {
          id: peerId,
          connected: chat.peerConnected || false,
          name: peerProfile?.name,
          status: chat.peerConnected ? 'connected' : 'disconnected',
        };

        const lastMessage = chat.messages[chat.messages.length - 1];
        const lastActivity =
          lastMessage?.timestamp || peerData?.lastSeen || Date.now();

        conversations.push({
          chatId: chat.id,
          peer: peerConnection,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                fromPeerId: lastMessage.senderId,
                toPeerId: peerId,
                originalText: lastMessage.text,
                translatedText: lastMessage.text,
                language: 'en',
                timestamp: lastMessage.timestamp,
                type: lastMessage.type as any,
                audioData: (lastMessage as any).audioData,
                audioDuration: (lastMessage as any).audioDuration,
                audioSampleRate: (lastMessage as any).audioSampleRate,
                transcription: lastMessage.transcription,
                transcriptionLanguage: (lastMessage as any).transcriptionLanguage,
                translation: (lastMessage as any).translation,
              }
            : undefined,
          lastActivity,
        });
      });

      return conversations.sort((a, b) => b.lastActivity - a.lastActivity);
    },
    []
  );

  const updatePeerStatus = useCallback(
    (peerId: string, status: 'connected' | 'disconnected' | 'connecting') => {
      if (status === 'connected') {
        loadConversations();
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.peer.id === peerId
              ? {
                  ...conv,
                  peer: {
                    ...conv.peer,
                    status,
                    connected: false,
                  },
                }
              : conv
          )
        );
      }
    },
    [loadConversations]
  );

  return {
    conversations,
    isLoading,
    loadConversations,
    updatePeerStatus,
  };
};
