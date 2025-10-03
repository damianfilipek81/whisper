import React from 'react';
import { View, Modal, Alert } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import {
  isWhisperQRData,
  isValidHexKey,
  getConnectionKey,
  type WhisperQRData,
} from '@/types/qr.types';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ visible, onClose, onScan }) => {
  const handleQRScan = (result: BarcodeScanningResult) => {
    const data = result.data.trim();

    try {
      const parsedData = JSON.parse(data);

      if (isWhisperQRData(parsedData)) {
        const connectionKey = getConnectionKey(parsedData);
        onScan(connectionKey);
        return;
      }
    } catch (error) {
      // If JSON parsing fails, continue to check if it's a raw hex key
    }

    if (isValidHexKey(data)) {
      onScan(data);
      return;
    }

    Alert.alert(
      'Invalid QR Code',
      'This QR code does not contain a valid Whisper peer key.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scannerCamera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleQRScan}
        />

        <View style={styles.scannerOverlay}>
          <View style={styles.scannerTopContent}>
            <Button
              variant="ghost"
              onPress={onClose}
              style={styles.scannerCloseButton}
              icon={<Ionicons name="close" size={24} color="#FFFFFF" />}
            >
              <Typography variant="button" color="inverse">
                Close
              </Typography>
            </Button>
            <Typography variant="heading3" style={styles.scannerTitle}>
              Scan QR Code
            </Typography>
            <Typography variant="body" style={styles.scannerSubtitle}>
              Point your camera at a Whisper QR code
            </Typography>
          </View>

          <View style={styles.scannerFrame}>
            <View style={styles.scannerMarker} />
          </View>

          <View style={styles.scannerBottomContent}>
            <Typography variant="caption" style={styles.scannerInstructions}>
              Make sure the QR code is clearly visible and well-lit
            </Typography>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerCamera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerMarker: {
    width: 250,
    height: 250,
    borderColor: theme.colors.primary,
    borderWidth: 3,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  scannerTopContent: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
    paddingTop: rt.insets.top,
  },
  scannerCloseButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.lg,
    paddingHorizontal: 0,
  },
  scannerTitle: {
    color: 'white',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  scannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scannerBottomContent: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  scannerInstructions: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
}));
