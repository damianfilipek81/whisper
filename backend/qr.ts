import b4a from 'b4a';

export function encodeShareCode(publicKey: Buffer): string {
  return b4a.toString(publicKey, 'hex');
}

export function decodeShareCode(shareCode: string): Buffer {
  return b4a.from(shareCode, 'hex') as Buffer;
}
