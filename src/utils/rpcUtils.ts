import { Buffer } from 'buffer';

export function convertToString(data: any): string {
  if (!data) {
    return '';
  }

  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
  } else if (typeof data === 'string') {
    return data;
  } else {
    throw new Error(`Unexpected data type: ${typeof data}, value: ${data}`);
  }
}

export function parseRPCData(data: any): any {
  if (!data) {
    return {};
  }

  const str = convertToString(data);
  
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Failed to parse RPC data:', {
      originalData: data,
      convertedString: str,
      error: error
    });
    throw new Error(`Invalid JSON data: ${str.substring(0, 100)}...`);
  }
}
