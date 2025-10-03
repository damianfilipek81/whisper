import { Buffer } from 'buffer';

/**
 * Converts various data types (Buffer, Uint8Array, string) to a proper string
 * This is needed for RPC communication where data can come in different formats
 */
export function convertToString(data: any): string {
  if (!data) {
    return '';
  }

  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    // Use TextDecoder for proper UTF-8 decoding
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
  } else if (typeof data === 'string') {
    return data;
  } else {
    throw new Error(`Unexpected data type: ${typeof data}, value: ${data}`);
  }
}

/**
 * Safely parses JSON from various data types
 * Handles Buffer, Uint8Array, and string inputs
 */
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
