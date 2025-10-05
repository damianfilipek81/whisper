import { Worklet } from 'react-native-bare-kit';
import RPC from 'bare-rpc';
import b4a from 'b4a';
import { Buffer } from 'buffer';
import { Paths } from 'expo-file-system';
import { convertToString, parseRPCData } from '@/utils/rpcUtils';
// @ts-ignore
import bundle from '@/../backend/build/app.bundle.mjs';
import {
  RPC_INIT,
  RPC_SET_USER_PROFILE,
  RPC_GET_USER_PROFILE,
  RPC_START_CHAT_WITH_USER,
  RPC_GET_CHAT_MESSAGES,
  RPC_SEND_MESSAGE,
  RPC_CONNECT_BY_SHARE_CODE,
  RPC_GET_ACTIVE_CHATS,
  RPC_GENERATE_PUBLIC_INVITE,
  RPC_RESET_ALL_DATA,
  RPC_DESTROY,
  RPC_PEER_CONNECTED,
  RPC_PEER_DISCONNECTED,
  RPC_MESSAGE_RECEIVED,
  RPC_ERROR,
  RPC_GET_PEER_STATUS,
  RPC_GET_KNOWN_PEERS,
} from '@/../shared/constants';

export interface PearsServiceEvents {
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string, error?: string) => void;
  onMessageReceived?: (message: any, chatId: string) => void;
  onError?: (error: string) => void;
}

export class PearsService {
  private worklet: Worklet | null = null;
  private rpc: RPC | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private currentUserId: string | null = null;

  public onPeerConnected?: (peerId: string) => void;
  public onPeerDisconnected?: (peerId: string, error?: string) => void;
  public onMessageReceived?: (message: any, chatId: string) => void;
  public onError?: (error: string) => void;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.isInitialized) return;
      throw new Error('Initialization failed during concurrent attempt');
    }

    this.isInitializing = true;

    try {
      if (this.worklet) {
        try {
          this.worklet.terminate();
          await new Promise((resolve) => setTimeout(resolve, 150));
        } catch (error) {
          console.warn('Error terminating old worklet:', error);
        }
        this.worklet = null;
      }

      this.worklet = new Worklet();
      const documentsUrl = Paths.document.uri;
      const documentsPath =
        documentsUrl.replace('file://', '') + '/whisper-hyper-data';
      this.worklet.start('/app.bundle', bundle, [documentsPath]);

      const { IPC } = this.worklet;
      this.rpc = new RPC(IPC as any, (req) => {
        this.handleBackendEvent(req);
      });

      const initResponse = await this.sendRPCCommand(RPC_INIT, {
        storagePath: documentsPath,
      });

      if (initResponse.success) {
        this.currentUserId = initResponse.userId;
        this.isInitialized = true;
      } else {
        throw new Error('Backend initialization failed');
      }
    } catch (error) {
      console.error('pearsService initialization failed:', error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async sendRPCCommand(command: number, data?: any): Promise<any> {
    if (!this.rpc) throw new Error('RPC not initialized');

    const req = this.rpc.request(command);
    const payload = data ? JSON.stringify(data) : '{}';
    req.send(b4a.from(payload, 'utf8') as any);

    const response = await req.reply();
    if (!response) throw new Error('No response from backend');

    const responseStr = convertToString(response);
    return JSON.parse(responseStr);
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  async getPeerConnectionStatus(
    peerId: string
  ): Promise<'connected' | 'disconnected'> {
    try {
      if (!this.isInitialized) return 'disconnected';

      const response = await this.sendRPCCommand(RPC_GET_PEER_STATUS, { peerId });
      return response.status || 'disconnected';
    } catch (error) {
      console.warn(`Failed to get peer status for ${peerId}:`, error);
      return 'disconnected';
    }
  }

  async isPeerConnected(peerId: string): Promise<boolean> {
    const status = await this.getPeerConnectionStatus(peerId);
    return status === 'connected';
  }

  async connectToPeer(
    peerId: string
  ): Promise<{ success: boolean; chatId?: string; error?: string }> {
    try {
      const response = await this.startChatWithUser(peerId);
      return { success: true, chatId: response.chatId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to connect to peer ${peerId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private handleBackendEvent(req: any): void {
    try {
      const eventType = req.command;
      const eventData = req.data ? parseRPCData(req.data) : {};

      switch (eventType) {
        case RPC_PEER_CONNECTED:
          this.onPeerConnected?.(eventData.data.peerId);
          break;

        case RPC_PEER_DISCONNECTED:
          this.onPeerDisconnected?.(eventData.data.peerId, eventData.data.error);
          break;

        case RPC_MESSAGE_RECEIVED:
          this.onMessageReceived?.(eventData.data.message, eventData.data.chatId);
          break;

        case RPC_ERROR:
          console.error('Backend error:', eventData.data.error);
          this.onError?.(eventData.data.error);
          break;

        default:
          console.warn('Unknown backend event:', eventType);
      }
    } catch (error) {
      console.error('Failed to handle backend event:', error);
    }
  }

  async setUserProfile(profile: {
    name: string;
    [key: string]: any;
  }): Promise<{ success: boolean }> {
    return await this.sendRPCCommand(RPC_SET_USER_PROFILE, profile);
  }

  async getUserProfile(userId?: string): Promise<{ profile: any }> {
    return await this.sendRPCCommand(RPC_GET_USER_PROFILE, { userId });
  }

  async startChatWithUser(
    targetUserId: string
  ): Promise<{ success: boolean; chatId: string }> {
    return await this.sendRPCCommand(RPC_START_CHAT_WITH_USER, { targetUserId });
  }

  async sendMessage(
    chatId: string,
    text: string,
    type: string = 'text',
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId: string }> {
    return await this.sendRPCCommand(RPC_SEND_MESSAGE, {
      chatId,
      text,
      type,
      ...metadata,
    });
  }

  async getChatMessages(
    chatId: string,
    limit: number = 50
  ): Promise<{ messages: any[] }> {
    return await this.sendRPCCommand(RPC_GET_CHAT_MESSAGES, { chatId, limit });
  }

  async connectByShareCode(
    shareCode: string
  ): Promise<{ success: boolean; chatId: string; connectedTo: string }> {
    return await this.sendRPCCommand(RPC_CONNECT_BY_SHARE_CODE, { shareCode });
  }

  async getActiveChats(): Promise<{ chats: any[] }> {
    return await this.sendRPCCommand(RPC_GET_ACTIVE_CHATS);
  }

  async getKnownPeers(): Promise<{ peers: any[] }> {
    return await this.sendRPCCommand(RPC_GET_KNOWN_PEERS);
  }

  async generatePublicInvite(): Promise<{ success: boolean; shareCode: string }> {
    return await this.sendRPCCommand(RPC_GENERATE_PUBLIC_INVITE);
  }

  async resetAllData(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      if (!this.rpc) {
        throw new Error('RPC not initialized');
      }

      const backendResult = await this.sendRPCCommand(RPC_RESET_ALL_DATA);

      if (!backendResult.success) {
        throw new Error(`Backend reset failed: ${backendResult.error}`);
      }

      await this.destroy();

      return { success: true, message: 'All data reset successfully' };
    } catch (error) {
      console.error('Failed to reset data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async destroy(): Promise<void> {
    if (this.worklet) {
      try {
        await this.sendRPCCommand(RPC_DESTROY);
      } catch (error) {
        console.warn('Error during RPC destroy:', error);
      }

      try {
        this.worklet.terminate();
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        console.warn('Error terminating worklet:', error);
      }

      this.worklet = null;
    }

    this.rpc = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.currentUserId = null;
  }
}

export const pearsService = new PearsService();
