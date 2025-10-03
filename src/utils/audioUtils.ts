/**
 * Convert Float32Array audio data to WAV format
 * @param audioData - Float32Array with audio samples (-1.0 to 1.0)
 * @param sampleRate - Sample rate in Hz (e.g., 16000)
 * @returns Base64-encoded WAV file
 */
export function float32ArrayToWav(
  audioData: Float32Array,
  sampleRate: number = 16000
): string {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Convert Float32Array to Int16Array
  const int16Data = new Int16Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Calculate sizes
  const dataSize = int16Data.length * bytesPerSample;
  const fileSize = 44 + dataSize; // WAV header is 44 bytes

  // Create WAV file buffer
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write audio data
  let offset = 44;
  for (let i = 0; i < int16Data.length; i++) {
    view.setInt16(offset, int16Data[i], true);
    offset += 2;
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert number array (from backend) to Float32Array
 */
export function numberArrayToFloat32Array(data: number[]): Float32Array {
  return new Float32Array(data);
}

/**
 * Get audio file URI from audioData
 * @param audioData - Audio data as number array
 * @param sampleRate - Sample rate in Hz
 * @returns Data URI for audio playback
 */
export function getAudioFileUri(
  audioData: number[],
  sampleRate: number = 16000
): string {
  const float32Data = numberArrayToFloat32Array(audioData);
  const wavBase64 = float32ArrayToWav(float32Data, sampleRate);
  return `data:audio/wav;base64,${wavBase64}`;
}

/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:23")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
