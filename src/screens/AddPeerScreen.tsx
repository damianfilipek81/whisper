import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SharePeerCard } from '@/components/SharePeerCard';
import { ConnectToPeerCard } from '@/components/ConnectToPeerCard';
import { QRScanner } from '@/components/QRScanner';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { usePeerConnection } from '@/hooks/usePeerConnection';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddPeer'>;

export const AddPeerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const {
    peerKey,
    setPeerKey,
    isConnecting,
    showScanner,
    setShowScanner,
    publicInviteCode,
    handleConnectToPeer,
    handleQRScan,
    handleOpenScanner,
  } = usePeerConnection();

  return (
    <>
      <KeyboardAvoidingView
        behavior="position"
        style={styles.keyboardContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Add Peer" onBack={() => navigation.goBack()} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your QR Code</Text>
            <SharePeerCard
              discoveryKey={publicInviteCode || undefined}
              qrData={publicInviteCode || null}
              style={styles.shareCard}
            />
          </View>

          <View style={styles.section}>
            <ConnectToPeerCard
              peerKey={peerKey}
              onPeerKeyChange={setPeerKey}
              onConnect={handleConnectToPeer}
              onScanQR={handleOpenScanner}
              isConnecting={isConnecting}
              style={styles.connectCard}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
    </>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: rt.insets.top,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  shareCard: {
    marginHorizontal: theme.spacing.lg,
  },
  connectCard: {
    marginHorizontal: theme.spacing.lg,
  },
}));
