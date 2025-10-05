import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { pearsService } from '@/services/pearsService';
import { UserProfileStorage } from '@/services/storageService';
import { useAppInitialization } from './useAppInitialization';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AddPeer'>;

export const usePeerConnection = () => {
  const navigation = useNavigation<NavigationProp>();
  const [peerKey, setPeerKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [publicInviteCode, setPublicInviteCode] = useState<string | null>(null);
  const { isInitialized } = useAppInitialization();

  const userPublicKey = UserProfileStorage.getUserProfile()?.id;

  useEffect(() => {
    const generateInvite = async () => {
      try {
        if (isInitialized) {
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
  }, [userPublicKey, isInitialized]);

  const handleConnectToPeer = async () => {
    if (!peerKey.trim()) {
      Alert.alert('Error', 'Please enter a share code or scan QR code');
      return;
    }

    setIsConnecting(true);
    try {
      const shareCodeToUse = peerKey.trim();

      if (!isInitialized) {
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
    setPeerKey(data);
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

  return {
    peerKey,
    setPeerKey,
    isConnecting,
    showScanner,
    setShowScanner,
    publicInviteCode,
    handleConnectToPeer,
    handleQRScan,
    handleOpenScanner,
  };
};
