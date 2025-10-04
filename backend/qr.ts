import b4a from 'b4a';

/**
 * Encode a public key as a share code (hex string)
 */
export function encodeShareCode(publicKey: Buffer): string {
  return b4a.toString(publicKey, 'hex');
}

/**
 * Decode a share code (hex string) back to a Buffer
 */
export function decodeShareCode(shareCode: string): Buffer {
  return b4a.from(shareCode, 'hex') as Buffer;
}
