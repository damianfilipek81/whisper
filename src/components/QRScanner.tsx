import React, { useRef, useEffect } from 'react';
import { View, Modal } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ visible, onClose, onScan }) => {
  const hasScanned = useRef(false);

  useEffect(() => {
    if (visible) {
      hasScanned.current = false;
    }
  }, [visible]);

  const handleQRScan = (result: BarcodeScanningResult) => {
    if (hasScanned.current) {
      return;
    }

    hasScanned.current = true;
    const data = result.data.trim();

    onScan(data);
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
    paddingTop: rt.insets.top + theme.spacing.md,
  },
  scannerCloseButton: {
    position: 'absolute',
    top: rt.insets.top + theme.spacing.md,
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
    paddingTop: theme.spacing.lg,
    paddingBottom: rt.insets.bottom + theme.spacing.lg,
    alignItems: 'center',
  },
  scannerInstructions: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
}));
