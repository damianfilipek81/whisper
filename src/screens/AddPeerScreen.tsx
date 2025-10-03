import React, { useEffect, useState } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCameraPermissions } from 'expo-camera';
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SharePeerCard } from '@/components/SharePeerCard';
import { ConnectToPeerCard } from '@/components/ConnectToPeerCard';
import { QRScanner } from '@/components/QRScanner';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { createWhisperQRData, type WhisperQRData } from '@/types/qr.types';
import { pearsService } from '@/services/pearsService';
import { UserProfileStorage } from '@/services/storageService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddPeer'>;

export const AddPeerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [peerKey, setPeerKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [publicInviteCode, setPublicInviteCode] = useState<string | null>(null);
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onStart: (e) => {
      'worklet';
      keyboardHeight.value = withTiming(e.height, { duration: 250 });
    },
    onEnd: () => {
      'worklet';
      keyboardHeight.value = withTiming(0, { duration: 250 });
    },
  });

  const userPublicKey = UserProfileStorage.getUserProfile()?.id;
  useEffect(() => {
    const generateInvite = async () => {
      try {
        console.log('📱 Generating public invite...');
        if (pearsService.initialized) {
          const response = await pearsService.generatePublicInvite();
          if (response.success) {
            setPublicInviteCode(response.shareCode);
          } else {
            throw new Error('Failed to generate invite');
          }
        } else {
          setPublicInviteCode('');
        }
      } catch (error) {
        console.error('❌ [STEP 1ERROR] Failed to generate public invite:', error);
        setPublicInviteCode('');
      }
    };

    generateInvite();
  }, [userPublicKey]);

  const handleConnectToPeer = async () => {
    if (!peerKey.trim()) {
      Alert.alert('Error', 'Please enter a share code or scan QR code');
      return;
    }

    setIsConnecting(true);
    try {
      const shareCodeToUse = peerKey.trim();

      if (!pearsService.initialized) {
        throw new Error('P2P service not initialized');
      }

      const response = await pearsService.connectByShareCode(shareCodeToUse);
      if (response.success) {
        navigation.replace('UsersList');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('❌ Connection failed:', error);
      Alert.alert(
        'Connection Failed',
        'Could not connect to peer. Please check the share code and try again.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQRScan = (data: string) => {
    try {
      // Parse QR data - it's wrapped in WhisperQRData format
      const qrData = JSON.parse(data);

      if (qrData.type === 'whisper_p2p' && qrData.shareCode) {
        // Extract the actual share code from the wrapper
        setPeerKey(qrData.shareCode);
      } else {
        // Fallback: treat as raw share code
        setPeerKey(data);
      }
    } catch (error) {
      // If parsing fails, treat as raw share code (backward compatibility)
      console.log('QR data is not JSON, using as-is');
      setPeerKey(data);
    }
    setShowScanner(false);
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan QR codes.'
        );
        return;
      }
    }

    setShowScanner(true);
  };

  const qrDataObject: WhisperQRData | null = publicInviteCode
    ? createWhisperQRData({
        shareCode: publicInviteCode,
      })
    : null;

  const qrData = qrDataObject ? JSON.stringify(qrDataObject) : null;

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: keyboardHeight.value > 0 ? keyboardHeight.value : 0,
    };
  });

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
          <Animated.View style={[styles.container, animatedContentStyle]}>
            <ScreenHeader title="Add Peer" onBack={() => navigation.goBack()} />

            <SharePeerCard
              discoveryKey={publicInviteCode || undefined}
              qrData={qrData}
              style={styles.card}
            />

            <ConnectToPeerCard
              peerKey={peerKey}
              onPeerKeyChange={setPeerKey}
              onConnect={handleConnectToPeer}
              onScanQR={handleOpenScanner}
              isConnecting={isConnecting}
              style={styles.card}
            />
          </Animated.View>
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
  container: {
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    paddingTop: rt.insets.top,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
}));
