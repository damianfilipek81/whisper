/**
 * TypeScript types for QR code data structures and validation
 */

/**
 * Whisper P2P QR code data structure (Share code based architecture)
 * Contains share code for P2P connection
 */
export interface WhisperQRData {
  /** QR code type identifier - always 'whisper_p2p' for our app */
  type: 'whisper_p2p';
  /** Share code for P2P connection (JSON string) */
  shareCode: string;
  /** QR code format version for future compatibility */
  version: string;
  /** Legacy: Discovery key for backward compatibility */
  discoveryKey?: string;
}

/**
 * Validation constants for cryptographic keys
 */
export const KEY_VALIDATION = {
  /** Length of hex-encoded public keys in characters (32 bytes * 2) */
  HEX_KEY_LENGTH: 64,
  /** Regex pattern for validating 64-character hexadecimal strings */
  HEX_KEY_PATTERN: /^[a-fA-F0-9]{64}$/,
  /** Supported QR code versions */
  SUPPORTED_VERSIONS: ['1.0'] as const,
} as const;

/**
 * Type guard to check if data matches WhisperQRData structure
 * @param data - Data to validate
 * @returns True if data is valid WhisperQRData
 */
export function isWhisperQRData(data: any): data is WhisperQRData {
  return (
    typeof data === 'object' &&
    data !== null &&
    data.type === 'whisper_p2p' &&
    ((typeof data.shareCode === 'string' && data.shareCode.length > 0) ||
     (typeof data.discoveryKey === 'string' && data.discoveryKey.length > 0)) &&
    typeof data.version === 'string' &&
    KEY_VALIDATION.SUPPORTED_VERSIONS.includes(data.version as any)
  );
}

/**
 * Validates if a string is a valid 64-character hexadecimal key
 * Used for public keys, peer IDs, and discovery keys
 * @param key - String to validate
 * @returns True if key is valid hex format
 */
export function isValidHexKey(key: string): boolean {
  return KEY_VALIDATION.HEX_KEY_PATTERN.test(key);
}

/**
 * Extracts the connection info from QR data
 * @param qrData - Validated WhisperQRData
 * @returns Share code or discovery key string to use for connection
 */
export function getConnectionKey(qrData: WhisperQRData): string {
  return qrData.shareCode || qrData.discoveryKey || '';
}

/**
 * Creates a properly formatted WhisperQRData object
 * @param params - QR data parameters
 * @returns Formatted QR data object
 */
export function createWhisperQRData(params: {
  shareCode?: string;
  discoveryKey?: string;
  version?: string;
}): WhisperQRData {
  if (!params.shareCode && !params.discoveryKey) {
    throw new Error('Either shareCode or discoveryKey must be provided');
  }
  
  return {
    type: 'whisper_p2p',
    shareCode: params.shareCode || '',
    discoveryKey: params.discoveryKey,
    version: params.version || '1.0',
  };
}
