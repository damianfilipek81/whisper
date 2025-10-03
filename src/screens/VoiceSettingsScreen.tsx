import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, SafeAreaView, StatusBar } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { SettingRow } from '@/components/ui/SettingRow';
import { ModelStatusCard } from '@/components/ui/ModelStatusCard';
import { PickerRow } from '@/components/ui/PickerRow';
import {
  ChatVoiceSettings,
  ChatVoiceSettingsStorage,
  WhisperModelType,
  WHISPER_MODELS,
} from '@/services/storageService';
import { SUPPORTED_LANGUAGES } from '@/utils/languages';
import {
  useSpeechToText,
  WHISPER_TINY,
  WHISPER_BASE,
  WHISPER_SMALL,
} from 'react-native-executorch';
import { RootStackParamList } from '@/navigation/AppNavigator';

type VoiceSettingsScreenRouteProp = RouteProp<RootStackParamList, 'VoiceSettings'>;
type VoiceSettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'VoiceSettings'
>;

const MODEL_CONSTANTS: Record<WhisperModelType, any> = {
  tiny: WHISPER_TINY,
  base: WHISPER_BASE,
  small: WHISPER_SMALL,
};

export const VoiceSettingsScreen: React.FC = () => {
  const { rt } = useUnistyles();
  const navigation = useNavigation<VoiceSettingsScreenNavigationProp>();
  const route = useRoute<VoiceSettingsScreenRouteProp>();
  const { chatId } = route.params;

  const [autoTranslate, setAutoTranslate] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedModel, setSelectedModel] = useState<WhisperModelType>('tiny');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Initialize model for download tracking
  const model = useSpeechToText({
    model: MODEL_CONSTANTS[selectedModel],
  });

  useEffect(() => {
    const settings = ChatVoiceSettingsStorage.getChatSettings(chatId);
    setAutoTranslate(settings.autoTranslateToEnglish);
    setAutoTranscribe(settings.autoTranscribe);
    setSelectedLanguage(settings.spokenLanguage);
    setSelectedModel(settings.whisperModel);
  }, [chatId]);

  // Track model download progress
  useEffect(() => {
    if (model.isReady) {
      setIsDownloading(false);
      setDownloadProgress(1);
    } else if (model.error) {
      setIsDownloading(false);
      Alert.alert('Download Error', model.error);
    }
  }, [model.isReady, model.error]);

  const handleDownloadModel = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress (react-native-executorch downloads automatically)
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 0.9) {
          clearInterval(progressInterval);
          return 0.9;
        }
        return prev + 0.1;
      });
    }, 500);
  };

  const handleSave = () => {
    const settings: ChatVoiceSettings = {
      autoTranslateToEnglish: autoTranslate,
      autoTranscribe: autoTranscribe,
      spokenLanguage: selectedLanguage,
      whisperModel: selectedModel,
    };
    ChatVoiceSettingsStorage.saveChatSettings(chatId, settings);
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Prepare picker options
  const modelOptions = Object.entries(WHISPER_MODELS).map(([key, modelInfo]) => ({
    value: key as WhisperModelType,
    label: `Whisper ${modelInfo.type.toUpperCase()} - ${modelInfo.size} (${modelInfo.description})`,
  }));

  const languageOptions = SUPPORTED_LANGUAGES.sort((a, b) =>
    a.name.localeCompare(b.name)
  ).map((lang) => ({
    value: lang.code,
    label: lang.name,
  }));

  const selectedModelInfo = WHISPER_MODELS[selectedModel];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={styles.safeArea.backgroundColor}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Typography 
              variant="heading2" 
              weight="bold"
              iconLeft={<Ionicons name="mic-outline" size={24} color="#000000" />}
            >
              Voice Settings
            </Typography>
            <Typography variant="caption" color="muted">
              Configure speech recognition and translation
            </Typography>
          </View>
          <Button
            variant="ghost"
            size="small"
            onPress={handleClose}
            icon={<Ionicons name="close" size={28} color="#000000" />}
          />
        </View>

        {/* Experimental Banner */}
        <View style={styles.experimentalBanner}>
          <Typography 
            variant="caption" 
            color="muted"
            iconLeft={<Ionicons name="warning-outline" size={16} color="#FF9800" />}
          >
            Experimental feature - accuracy may vary
          </Typography>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Model Status Card */}
          <ModelStatusCard
            isReady={model.isReady}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            onDownload={handleDownloadModel}
          />

          <View style={styles.divider} />

          {/* AI Model Selection */}
          <PickerRow
            icon="hardware-chip-outline"
            title="AI Model"
            subtitle={`${selectedModelInfo.size} • ${selectedModelInfo.description}`}
            selectedValue={selectedModel}
            options={modelOptions}
            onValueChange={setSelectedModel}
          />

          <View style={styles.divider} />

          {/* Language Selection */}
          <PickerRow
            icon="globe-outline"
            title="Spoken Language"
            subtitle="Language you speak in this chat"
            selectedValue={selectedLanguage}
            options={languageOptions}
            onValueChange={setSelectedLanguage}
          />

          <View style={styles.divider} />

          {/* Auto-Transcribe Toggle */}
          <SettingRow
            icon="document-text-outline"
            title="Auto-Transcribe"
            description="Convert voice to text in spoken language"
            value={autoTranscribe}
            onValueChange={setAutoTranscribe}
          />

          <View style={styles.divider} />

          {/* Auto-Translate Toggle */}
          <SettingRow
            icon="language-outline"
            title="Auto-Translate to English"
            description="Automatically translate messages to English"
            value={autoTranslate}
            onValueChange={setAutoTranslate}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            onPress={handleSave}
            fullWidth
            icon={<Ionicons name="save-outline" size={20} color="#FFFFFF" />}
          >
            Save Settings
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.otherMessage + '30',
  },
  headerContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  experimentalBanner: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage + '50',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.otherMessage + '20',
    marginVertical: theme.spacing.md,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: (rt.insets.bottom || 0) + theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.otherMessage + '30',
    backgroundColor: theme.colors.background,
  },
}));

