import React, { useEffect } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { StatusBar } from '@/components/StatusBar';
import { PeerItem } from '@/components/PeerItem';
import { EmptyPeersState } from '@/components/EmptyPeersState';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { Conversation } from '@/types';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useConversations } from '@/hooks/useConversations';
import { useChatNavigation } from '@/hooks/useChatNavigation';
import { usePeerEvents } from '@/hooks/usePeerEvents';

export const UsersListScreen: React.FC = () => {
  const { isInitialized: isServerStarted } = useAppInitialization();

  const { conversations, loadConversations, updatePeerStatus } = useConversations();
  const { openChat, navigateToAddPeer, navigateToSettings } = useChatNavigation();

  usePeerEvents({
    onPeerConnecting: (peerId) => updatePeerStatus(peerId, 'connecting'),
    onPeerConnected: (peerId) => updatePeerStatus(peerId, 'connected'),
    onPeerDisconnected: (peerId) => updatePeerStatus(peerId, 'disconnected'),
  });

  // Load conversations when backend is ready
  useEffect(() => {
    if (isServerStarted) {
      loadConversations();
    }
  }, [isServerStarted, loadConversations]);

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <PeerItem peer={item.peer} onPress={() => openChat(item)} />
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="heading2">Whisper P2P</Typography>
          <TouchableOpacity
            onPress={navigateToSettings}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={28} color="#000000" />
          </TouchableOpacity>
        </View>

        <StatusBar
          isServerStarted={isServerStarted}
          peerCount={conversations.length}
        />

        <View style={styles.listContainer}>
          {conversations.length === 0 ? (
            <EmptyPeersState onAddPeer={navigateToAddPeer} />
          ) : (
            <FlashList
              data={conversations}
              renderItem={renderConversationItem}
              getItemType={() => 'conversation'}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      <FloatingAddButton
        visible={conversations.length > 0}
        onPress={navigateToAddPeer}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: rt.insets.top,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  peersContent: {
    paddingBottom: theme.spacing.xl,
  },
}));
