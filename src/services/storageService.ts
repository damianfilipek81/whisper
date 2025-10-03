import { MMKV } from 'react-native-mmkv';

export const settingsStorage = new MMKV({
  id: 'settings-storage',
});

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  isProfileCompleted: boolean;
}

export const UserProfileStorage = {
  getUserProfile: (): UserProfile | null => {
    const profile = settingsStorage.getString('user_profile');
    return profile ? JSON.parse(profile) : null;
  },

  setUserProfile: (profile: UserProfile): void => {
    settingsStorage.set('user_profile', JSON.stringify(profile));
  },

  clearUserProfile: (): void => {
    settingsStorage.delete('user_profile');
  },
};

export interface VoiceRecordingSettings {
  language: string;
  languageCode: string;
}

export const VoiceRecordingStorage = {
  getRecordingLanguage: (): string => {
    const settings = settingsStorage.getString('voice_recording_settings');
    const parsedSettings: VoiceRecordingSettings | null = settings
      ? JSON.parse(settings)
      : null;
    return parsedSettings?.languageCode || 'en-US'; // Default to English
  },

  setRecordingLanguage: (language: string, languageCode: string): void => {
    const settings: VoiceRecordingSettings = { language, languageCode };
    settingsStorage.set('voice_recording_settings', JSON.stringify(settings));
  },
};

export type WhisperModelType = 'tiny' | 'base' | 'small';

export interface WhisperModelInfo {
  type: WhisperModelType;
  size: string;
  description: string;
}

export const WHISPER_MODELS: Record<WhisperModelType, WhisperModelInfo> = {
  tiny: {
    type: 'tiny',
    size: '151 MB',
    description: 'Fast, good for most devices',
  },
  base: {
    type: 'base',
    size: '290.6 MB',
    description: 'Balanced speed and accuracy',
  },
  small: {
    type: 'small',
    size: '968 MB',
    description: 'High accuracy, powerful devices only',
  },
};

export interface ChatVoiceSettings {
  autoTranslateToEnglish: boolean;
  autoTranscribe: boolean;
  spokenLanguage: string;
  whisperModel: WhisperModelType;
}

export const ChatVoiceSettingsStorage = {
  getChatSettings: (chatId: string): ChatVoiceSettings => {
    const key = `chat_voice_settings_${chatId}`;
    const settings = settingsStorage.getString(key);
    if (settings) {
      const parsed = JSON.parse(settings);
      // Ensure all fields have defaults for backward compatibility
      return {
        autoTranslateToEnglish: parsed.autoTranslateToEnglish ?? true,
        autoTranscribe: parsed.autoTranscribe ?? true,
        spokenLanguage: parsed.spokenLanguage ?? 'en',
        whisperModel: parsed.whisperModel ?? 'tiny',
      };
    }
    return {
      autoTranslateToEnglish: true,
      autoTranscribe: true,
      spokenLanguage: 'en',
      whisperModel: 'tiny',
    };
  },

  saveChatSettings: (chatId: string, settings: ChatVoiceSettings): void => {
    const key = `chat_voice_settings_${chatId}`;
    settingsStorage.set(key, JSON.stringify(settings));
  },

  clearChatSettings: (chatId: string): void => {
    const key = `chat_voice_settings_${chatId}`;
    settingsStorage.delete(key);
  },

  getAllChatSettings: (): Record<string, ChatVoiceSettings> => {
    const allKeys = settingsStorage.getAllKeys();
    const chatSettings: Record<string, ChatVoiceSettings> = {};

    allKeys.forEach((key) => {
      if (key.startsWith('chat_voice_settings_')) {
        const chatId = key.replace('chat_voice_settings_', '');
        const settings = settingsStorage.getString(key);
        if (settings) {
          chatSettings[chatId] = JSON.parse(settings);
        }
      }
    });

    return chatSettings;
  },
};
