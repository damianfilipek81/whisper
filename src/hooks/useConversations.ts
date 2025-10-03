import { useState, useCallback } from 'react';
import { Conversation, PeerConnection, BackendChat, BackendPeer } from '@/types';
import { pearsService } from '@/services/pearsService';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const response = await pearsService.getActiveChats();
      const backendChats = response.chats || [];

      const peersResponse = await pearsService.getKnownPeers();
      const knownPeers = peersResponse.peers || [];

      const conversationsFromChats = createConversationsFromChats(
        backendChats,
        knownPeers
      );
      setConversations(conversationsFromChats);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversationsFromChats = useCallback(
    (backendChats: BackendChat[], knownPeers: BackendPeer[]): Conversation[] => {
      const conversations: Conversation[] = [];

      backendChats.forEach((chat) => {
        const peerId = chat.peerId;
        if (!peerId) return;

        const peerData = knownPeers.find((p) => p.userId === peerId);

        const peerConnection: PeerConnection = {
          id: peerId,
          connected: chat.connected || false,
          name: peerData?.profile?.name,
          status: chat.connected ? 'connected' : 'disconnected',
        };

        conversations.push({
          chatId: chat.id,
          peer: peerConnection,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount || 0,
          lastActivity: chat.lastActivity || peerData?.lastSeen || Date.now(),
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
