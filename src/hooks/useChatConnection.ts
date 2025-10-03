import { useState, useEffect } from 'react';
import { pearsService } from '@/services/pearsService';

interface UseChatConnectionProps {
  peerId: string;
  initialConnected: boolean;
  initialStatus?: 'connected' | 'disconnected' | 'connecting';
}

interface UseChatConnectionReturn {
  isConnected: boolean;
  isConnecting: boolean;
}

export const useChatConnection = ({
  peerId,
  initialConnected,
  initialStatus = 'disconnected',
}: UseChatConnectionProps): UseChatConnectionReturn => {
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [isConnecting, setIsConnecting] = useState(initialStatus === 'connecting');

  useEffect(() => {
    const originalConnected = pearsService.onPeerConnected;
    const originalDisconnected = pearsService.onPeerDisconnected;

    pearsService.onPeerConnected = (connectedPeerId: string) => {
      if (connectedPeerId === peerId) {
        console.log(`Peer ${peerId} connected in chat`);
        setIsConnected(true);
        setIsConnecting(false);
      }
      originalConnected?.(connectedPeerId);
    };

    pearsService.onPeerDisconnected = (
      disconnectedPeerId: string,
      error?: string
    ) => {
      if (disconnectedPeerId === peerId) {
        console.log(`Peer ${peerId} disconnected in chat`);
        setIsConnected(false);
        setIsConnecting(false);
      }
      originalDisconnected?.(disconnectedPeerId, error);
    };

    return () => {
      pearsService.onPeerConnected = originalConnected;
      pearsService.onPeerDisconnected = originalDisconnected;
    };
  }, [peerId]);

  return {
    isConnected,
    isConnecting,
  };
};
