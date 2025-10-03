import b4a from 'b4a';

// Very simple share code: hex publicKey
export function encodeShareCode(publicKey) {
  return b4a.toString(publicKey, 'hex');
}

export function decodeShareCode(shareCode) {
  return b4a.from(shareCode, 'hex');
}
