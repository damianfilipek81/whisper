import { useEffect } from 'react';
import { pearsService } from '@/services/pearsService';

interface UsePeerEventsProps {
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string, error?: string) => void;
  onPeerConnecting?: (peerId: string) => void;
}

export const usePeerEvents = ({
  onPeerConnected,
  onPeerDisconnected,
  onPeerConnecting,
}: UsePeerEventsProps) => {
  useEffect(() => {
    const originalPeerConnected = pearsService.onPeerConnected;
    const originalPeerDisconnected = pearsService.onPeerDisconnected;
    const originalPeerConnecting = pearsService.onPeerConnecting;

    pearsService.onPeerConnected = (peerId: string) => {
      console.log(`🎉 Peer connected: ${peerId}`);
      onPeerConnected?.(peerId);
      originalPeerConnected?.(peerId);
    };

    pearsService.onPeerDisconnected = (peerId: string, error?: string) => {
      console.log(`💔 Peer disconnected: ${peerId}`, error ? `(${error})` : '');
      onPeerDisconnected?.(peerId, error);
      originalPeerDisconnected?.(peerId, error);
    };

    pearsService.onPeerConnecting = (peerId: string) => {
      console.log(`🔄 Peer connecting: ${peerId}`);
      onPeerConnecting?.(peerId);
      originalPeerConnecting?.(peerId);
    };

    return () => {
      pearsService.onPeerConnected = originalPeerConnected;
      pearsService.onPeerDisconnected = originalPeerDisconnected;
      pearsService.onPeerConnecting = originalPeerConnecting;
    };
  }, [onPeerConnected, onPeerDisconnected, onPeerConnecting]);
};
