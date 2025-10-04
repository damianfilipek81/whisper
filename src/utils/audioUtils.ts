export function float32ArrayToWav(
  audioData: Float32Array,
  sampleRate: number = 16000
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;

  const int16Data = new Int16Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const dataSize = int16Data.length * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < int16Data.length; i++) {
    view.setInt16(offset, int16Data[i], true);
    offset += 2;
  }

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

export function numberArrayToFloat32Array(data: number[]): Float32Array {
  return new Float32Array(data);
}

export function getAudioFileUri(
  audioData: number[],
  sampleRate: number = 16000
): string {
  const float32Data = numberArrayToFloat32Array(audioData);
  const wavBase64 = float32ArrayToWav(float32Data, sampleRate);
  return `data:audio/wav;base64,${wavBase64}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
