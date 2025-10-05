import { Buffer } from 'buffer';

/**
 * Sanitizes text for safe JSON serialization by removing invalid Unicode sequences.
 *
 * WHY WE NEED THIS:
 * The react-native-executorch Whisper model has a bug where it returns corrupted Unicode
 * for non-English characters (especially diacritics in Polish, Arabic, Chinese, etc).
 * Instead of proper characters like "ść", it outputs invalid surrogates like "ￅﾛￄﾇ".
 * These invalid sequences cause JSON.stringify() to throw "Bad Unicode escape" errors.
 *
 * WHAT THIS DOES:
 * - Normalizes text to Unicode NFC (composed form) - standard across all languages
 * - Removes \uFFFD (replacement character "�") - indicates encoding already failed
 * - Removes \uD800-\uDFFF (unpaired surrogates) - causes JSON.stringify to crash
 * - Removes \uFFF0-\uFFFF (Unicode specials) - non-characters not meant for text
 * - Removes control characters (invisible, non-printable)
 *
 * WHAT IT KEEPS:
 * - ALL valid characters from ALL languages (Polish ą,ć,ę,ł, Arabic أ,ب, Chinese 你,好, etc.)
 * - Emojis and symbols
 * - Whitespace (spaces, newlines, tabs)
 *
 * IMPORTANT:
 * This is a WORKAROUND, not a fix. It prevents crashes but doesn't fix transcription quality.
 * Text like "Cześć" will become "Cze" after sanitization because the model already corrupted it.
 * The real fix needs to come from react-native-executorch fixing their Unicode decoding.
 *
 * @param text - Text that may contain invalid Unicode from Whisper transcription
 * @returns Sanitized text safe for JSON serialization
 */
export function sanitizeForJSON(text: string): string {
  return (
    text
      // Normalize to composed form (NFC) - standard Unicode normalization
      .normalize('NFC')
      // Remove invalid Unicode that causes JSON.stringify to fail:
      // - \uFFFD: Replacement character (encoding already failed)
      // - \uFFF0-\uFFFF: Unicode specials block (non-characters)
      // - \uD800-\uDFFF: Unpaired surrogates (causes "Bad Unicode escape")
      .replace(/[\uFFFD\uFFF0-\uFFFF]|[\uD800-\uDFFF]/g, '')
      // Remove control characters except common whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  );
}

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
      error: error,
    });
    throw new Error(`Invalid JSON data: ${str.substring(0, 100)}...`);
  }
}
