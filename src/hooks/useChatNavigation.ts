import { useCallback } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Conversation } from '@/types';
import { pearsService } from '@/services/pearsService';
import { RootStackParamList } from '@/navigation/AppNavigator';

export const useChatNavigation = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const openChat = useCallback(
    async (conversation: Conversation) => {
      try {
        if (conversation.chatId && conversation.chatId.includes(':')) {
          navigation.navigate('Chat', {
            peer: conversation.peer,
            chatId: conversation.chatId,
          });
          return;
        }

        const result = await pearsService.startChatWithUser(conversation.peer.id);
        const chatId = result?.chatId || conversation.chatId;
        navigation.navigate('Chat', {
          peer: conversation.peer,
          chatId,
        });
      } catch (error) {
        console.error('Failed to open chat:', error);
        navigation.navigate('Chat', {
          peer: conversation.peer,
          chatId: conversation.chatId,
        });
      }
    },
    [navigation]
  );

  const navigateToAddPeer = useCallback(() => {
    navigation.navigate('AddPeer');
  }, [navigation]);

  const navigateToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return {
    openChat,
    navigateToAddPeer,
    navigateToSettings,
  };
};
