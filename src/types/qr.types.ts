export interface WhisperQRData {
  type: 'whisper_p2p';
  shareCode: string;
  version: string;
  discoveryKey?: string;
}

export const KEY_VALIDATION = {
  HEX_KEY_LENGTH: 64,
  HEX_KEY_PATTERN: /^[a-fA-F0-9]{64}$/,
  SUPPORTED_VERSIONS: ['1.0'] as const,
} as const;
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

export function isValidHexKey(key: string): boolean {
  return KEY_VALIDATION.HEX_KEY_PATTERN.test(key);
}

export function getConnectionKey(qrData: WhisperQRData): string {
  return qrData.shareCode || qrData.discoveryKey || '';
}

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
