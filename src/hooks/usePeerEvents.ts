import { useEffect } from 'react';
import { pearsService } from '@/services/pearsService';

interface UsePeerEventsProps {
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string, error?: string) => void;
}

export const usePeerEvents = ({
  onPeerConnected,
  onPeerDisconnected,
}: UsePeerEventsProps) => {
  useEffect(() => {
    const originalPeerConnected = pearsService.onPeerConnected;
    const originalPeerDisconnected = pearsService.onPeerDisconnected;

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

    return () => {
      pearsService.onPeerConnected = originalPeerConnected;
      pearsService.onPeerDisconnected = originalPeerDisconnected;
    };
  }, [onPeerConnected, onPeerDisconnected]);
};
