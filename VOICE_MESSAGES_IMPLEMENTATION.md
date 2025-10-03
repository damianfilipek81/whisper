# Voice Messages Implementation Plan

## Overview

Implement full voice message support with on-device transcription and translation using Whisper models.

## Tasks

### 1. Model Selection & Download

- [ ] Add model selection to `ChatSettingsModal.tsx`
  - WHISPER_TINY (151 MB) - default
  - WHISPER_BASE (290.6 MB) - balanced
  - WHISPER_SMALL (968 MB) - high accuracy
- [ ] Extend `storageService.ts` with model preference storage
- [ ] Implement download progress UI using react-native-executorch built-in progress
- [ ] Create `useWhisperModel` hook for model management

### 2. Audio Recording & Processing

- [ ] Extend `useAudioRecording.ts` to capture and store audio data
  - Store Float32Array chunks during recording
  - Combine chunks on recording stop
- [ ] Update `ChatInput` component to handle voice recording lifecycle
- [ ] Process audio after recording:
  - Transcribe using selected language (if enabled)
  - Translate to English (if enabled)
- [ ] Create `useVoiceMessage` hook for processing logic

### 3. Voice Message UI Component

- [ ] Create `VoiceMessageBubble.tsx` component with:
  - Audio waveform visualization
  - Play/Pause button
  - Duration display
  - Transcription text (collapsible)
  - Translation text (collapsible)
  - Loading states during processing
- [ ] Update `MessageBubble.tsx` to conditionally render voice messages
- [ ] Add audio playback using react-native-audio-api

### 4. Message Type Extension

- [ ] Update `PeerMessage` type in `types/index.ts`:
  ```typescript
  type: 'text' | 'audio' | 'voice'
  audioData?: Float32Array
  audioDuration?: number
  audioSampleRate?: number
  ```
- [ ] Create voice message metadata structure

### 5. Backend Integration

- [ ] Extend backend message schema:
  - Audio file/bytes storage
  - Metadata: timestamp, duration, sample rate
  - Transcription + language code
  - Translation (if applicable)
- [ ] Update `chat.mjs` to handle voice messages
- [ ] Implement audio data serialization/deserialization
- [ ] Update P2P message protocol

### 6. ChatScreen Integration

- [ ] Connect `onAudioData` callback to audio storage
- [ ] Trigger processing on recording stop
- [ ] Handle voice message sending
- [ ] Render voice messages in FlashList
- [ ] Show processing indicators

## Technical Details

### Audio Format

- Sample Rate: 16000 Hz (Whisper requirement)
- Format: Float32Array (mono channel)
- Storage: Raw bytes or compressed format

### Model Integration

```typescript
import {
  useSpeechToText,
  WHISPER_TINY,
  WHISPER_BASE,
  WHISPER_SMALL,
} from 'react-native-executorch';
```

### Processing Flow

1. User starts recording → capture chunks
2. User stops recording → combine chunks
3. If autoTranscribe enabled → transcribe(waveform, { language: selectedLanguage })
4. If autoTranslate enabled → transcribe(waveform, { language: 'en' })
5. Create voice message with audio + metadata
6. Send to backend
7. Display in chat

## Files to Create

- `src/hooks/useWhisperModel.ts` - Model management
- `src/hooks/useVoiceMessage.ts` - Voice message processing
- `src/components/VoiceMessageBubble.tsx` - Voice message UI
- `src/components/ModelDownloadModal.tsx` - Download progress UI
- `src/components/AudioPlayer.tsx` - Audio playback component

## Files to Modify

- `src/components/ChatSettingsModal.tsx` - Add model selection
- `src/services/storageService.ts` - Add model preference storage
- `src/hooks/useAudioRecording.ts` - Add audio data storage
- `src/components/ChatInput.tsx` - Handle voice recording
- `src/components/ChatScreen.tsx` - Integrate voice messages
- `src/components/MessageBubble.tsx` - Conditional rendering
- `src/types/index.ts` - Extend message types
- `backendv2/chat.mjs` - Handle voice messages

## Implementation Order

1. Storage & Model Selection UI (Phase 1)
2. Audio Capture & Processing (Phase 2)
3. Voice Message UI (Phase 3)
4. Backend Integration (Phase 4)
5. Full Integration & Testing (Phase 5)
