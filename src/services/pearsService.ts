import { Worklet } from 'react-native-bare-kit';
import RPC from 'bare-rpc';
import b4a from 'b4a';
import { Buffer } from 'buffer';
import { Paths } from 'expo-file-system';
import { convertToString, parseRPCData } from '@/utils/rpcUtils';
// @ts-ignore - bundle file is generated and doesn't have type definitions
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
  RPC_PEER_CONNECTING,
  RPC_ERROR,
  RPC_GET_PEER_STATUS,
  RPC_GET_KNOWN_PEERS,
} from '@/../shared/constants';

// Types for service events
export interface PearsServiceEvents {
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string, error?: string) => void;
  onPeerConnecting?: (peerId: string) => void;
  onMessageReceived?: (message: any, chatId: string) => void;
  onError?: (error: string) => void;
}

export class PearsService {
  private worklet: Worklet | null = null;
  private rpc: RPC | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private currentUserId: string | null = null;

  // Removed local connection cache - using backend status only

  // Event callbacks
  public onPeerConnected?: (peerId: string) => void;
  public onPeerDisconnected?: (peerId: string, error?: string) => void;
  public onPeerConnecting?: (peerId: string) => void;
  public onMessageReceived?: (message: any, chatId: string) => void;
  public onError?: (error: string) => void;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Already initialized, skipping...');
      return;
    }

    if (this.isInitializing) {
      console.log('⏳ Already initializing, waiting...');
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.isInitialized) return;
      throw new Error('Initialization failed during concurrent attempt');
    }

    this.isInitializing = true;

    try {
      console.log('🚀 Starting pearsService initialization...');

      // If there's an old worklet (from Fast Refresh), terminate it first
      if (this.worklet) {
        console.log('🧹 Cleaning up old worklet before starting new one...');
        try {
          this.worklet.terminate();
          // Give backend time to cleanup before starting new worklet
          await new Promise((resolve) => setTimeout(resolve, 150));
        } catch (error) {
          console.warn('⚠️ Error terminating old worklet:', error);
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

      // Backend will generate/load keypair from its storage
      const initResponse = await this.sendRPCCommand(RPC_INIT, {
        storagePath: documentsPath,
      });

      if (initResponse.success) {
        this.currentUserId = initResponse.userId;
        this.isInitialized = true;
        console.log(
          '✅ pearsService initialized successfully with backend userId:',
          this.currentUserId
        );
      } else {
        throw new Error('Backend initialization failed');
      }
    } catch (error) {
      console.error('❌ pearsService initialization failed:', error);
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
    console.log('🔍 Sending RPC command:', command, 'with payload:', payload);
    req.send(b4a.from(payload, 'utf8') as any);

    // Wait for response
    const response = await req.reply();
    if (!response) throw new Error('No response from backend');

    // Handle Buffer/Uint8Array properly using utility
    const responseStr = convertToString(response);
    return JSON.parse(responseStr);
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // ============================================================================
  // PEER CONNECTION STATE (Backend-driven only)
  // ============================================================================

  /**
   * Get connection status for peer from backend
   */
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

  /**
   * Check if specific peer is connected (async, from backend)
   */
  async isPeerConnected(peerId: string): Promise<boolean> {
    const status = await this.getPeerConnectionStatus(peerId);
    return status === 'connected';
  }

  /**
   * Connect to a specific peer on-demand
   */
  async connectToPeer(
    peerId: string
  ): Promise<{ success: boolean; chatId?: string; error?: string }> {
    console.log(`🔌 Attempting to connect to peer: ${peerId}`);

    try {
      // Try to start chat (this will attempt connection)
      const response = await this.startChatWithUser(peerId);
      console.log(`✅ Chat created with peer ${peerId}, chat ID: ${response.chatId}`);

      return { success: true, chatId: response.chatId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`⚠️ Failed to connect to peer ${peerId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private handleBackendEvent(req: any): void {
    try {
      const eventType = req.command;
      console.log(
        '🔍 Backend event received:',
        eventType,
        'Raw data type:',
        typeof req.data
      );

      // Use utility to properly convert data
      const eventData = req.data ? parseRPCData(req.data) : {};
      console.log('🔍 Parsed event data:', eventData);

      switch (eventType) {
        case RPC_PEER_CONNECTING:
          console.log('🔄 [RPC_PEER_CONNECTING] Peer connecting...');
          console.log('🆔 Peer ID:', eventData.data.peerId);
          this.onPeerConnecting?.(eventData.data.peerId);
          break;

        case RPC_PEER_CONNECTED:
          console.log(
            '🎉 [RPC_PEER_CONNECTED] Peer connected with guaranteed profile data'
          );
          console.log('🆔 Peer ID:', eventData.data.peerId);
          console.log('👤 Profile:', eventData.data.profile);

          this.onPeerConnected?.(eventData.data.peerId);
          break;

        case RPC_PEER_DISCONNECTED:
          console.log(
            '💔 [STEP 5] RPC_PEER_DISCONNECTED event - triggering onPeerDisconnected callback'
          );
          console.log('🆔 Peer ID:', eventData.data.peerId);

          this.onPeerDisconnected?.(eventData.data.peerId, eventData.data.error);
          break;

        case RPC_MESSAGE_RECEIVED:
          console.log(
            '📨 [STEP 5] RPC_MESSAGE_RECEIVED event - triggering onMessageReceived callback'
          );
          console.log('💬 Chat ID:', eventData.data.chatId);
          this.onMessageReceived?.(eventData.data.message, eventData.data.chatId);
          break;

        case RPC_ERROR:
          console.log('❌ [STEP 5] RPC_ERROR event - triggering onError callback');
          console.log('🚨 Error:', eventData.data.error);
          this.onError?.(eventData.data.error);
          break;

        default:
          console.warn('❓ [STEP 5] Unknown backend event:', eventType);
      }
    } catch (error) {
      console.error('Failed to handle backend event:', error);
    }
  }

  // ============================================================================
  // HIGH-LEVEL API METHODS
  // ============================================================================

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
    console.log('🚀 [STEP 3C] pearsService.connectByShareCode() called');
    console.log('📤 Sending RPC_CONNECT_BY_SHARE_CODE to backend...');
    console.log('📋 Share code length:', shareCode.length);
    const response = await this.sendRPCCommand(RPC_CONNECT_BY_SHARE_CODE, {
      shareCode,
    });
    console.log(
      '📥 [STEP 4] Backend connectByShareCode response:',
      response.success ? '✅ Success' : '❌ Failed'
    );
    if (response.success) {
      console.log('🎯 [STEP 4] Connected to peer:', response.connectedTo);
      console.log('💬 [STEP 4] Chat ID:', response.chatId);
    }
    return response;
  }

  async getActiveChats(): Promise<{ chats: any[] }> {
    return await this.sendRPCCommand(RPC_GET_ACTIVE_CHATS);
  }

  async getKnownPeers(): Promise<{ peers: any[] }> {
    return await this.sendRPCCommand(RPC_GET_KNOWN_PEERS);
  }

  async generatePublicInvite(): Promise<{ success: boolean; shareCode: string }> {
    console.log('🔧 [STEP 1B] pearsService.generatePublicInvite() called');
    console.log('📤 Sending RPC_GENERATE_PUBLIC_INVITE to backend...');
    const response = await this.sendRPCCommand(RPC_GENERATE_PUBLIC_INVITE);
    console.log(
      '📥 [STEP 1C] Backend response received:',
      response.success ? '✅ Success' : '❌ Failed'
    );
    return response;
  }

  async resetAllData(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    console.log('🗑️ [RESET] Starting complete data reset...');

    try {
      if (!this.rpc) {
        throw new Error('RPC not initialized');
      }

      // 1. Reset all backend data (chats, peers, hypercores)
      console.log('🗑️ [RESET] Resetting backend data...');
      const backendResult = await this.sendRPCCommand(RPC_RESET_ALL_DATA);

      if (!backendResult.success) {
        throw new Error(`Backend reset failed: ${backendResult.error}`);
      }

      // 2. Destroy current service instance
      console.log('🗑️ [RESET] Destroying service instance...');
      await this.destroy();

      console.log('✅ [RESET] Complete data reset successful');
      return { success: true, message: 'All data reset successfully' };
    } catch (error) {
      console.error('❌ [RESET] Failed to reset data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async destroy(): Promise<void> {
    console.log('🛑 Destroying pearsService...');

    if (this.worklet) {
      try {
        // Tell backend to cleanup
        await this.sendRPCCommand(RPC_DESTROY);
      } catch (error) {
        console.warn('⚠️ Error during RPC destroy:', error);
      }

      try {
        this.worklet.terminate();
        // Give time for cleanup
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        console.warn('⚠️ Error terminating worklet:', error);
      }

      this.worklet = null;
    }

    this.rpc = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.currentUserId = null;

    console.log('✅ pearsService destroyed');
  }
}

export const pearsService = new PearsService();
