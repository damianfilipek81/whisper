/**
 * RPC Command Constants (v2)
 * Kept compatible with frontend expectations
 */

// ============================================================================
// COMMANDS (Frontend → Backend)
// ============================================================================

export const RPC_INIT = 1;
export const RPC_SET_USER_PROFILE = 2;
export const RPC_GET_USER_PROFILE = 3;
export const RPC_START_CHAT_WITH_USER = 4;
export const RPC_GET_CHAT_MESSAGES = 5;
export const RPC_SEND_MESSAGE = 6;
export const RPC_CONNECT_BY_SHARE_CODE = 7;
export const RPC_GET_ACTIVE_CHATS = 8;
export const RPC_GENERATE_PUBLIC_INVITE = 9;
export const RPC_RESET_ALL_DATA = 10;
export const RPC_DESTROY = 11;
export const RPC_GET_PEER_STATUS = 12;
export const RPC_GET_KNOWN_PEERS = 13;

// ============================================================================
// EVENTS (Backend → Frontend)
// ============================================================================

export const RPC_PEER_CONNECTED = 100;
export const RPC_PEER_DISCONNECTED = 101;
export const RPC_MESSAGE_RECEIVED = 102;
export const RPC_PEER_CONNECTING = 103;
export const RPC_ERROR = 104;

// ============================================================================
// CONFIGURATION
// ============================================================================

export const INVITE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
export const MESSAGE_BATCH_SIZE = 50;
export const APP_PROTOCOL = 'whisper/app/2.0.0';

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export const MESSAGE_TYPE_TEXT = 'text';
export const MESSAGE_TYPE_VOICE = 'voice';

