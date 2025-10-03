import React, { useState } from 'react';
import { View, Alert, ScrollView, Platform } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

import { pearsService } from '@/services/pearsService';
import { UserProfileStorage } from '@/services/storageService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';

export const UserSetupScreen: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const handleSetupComplete = async () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      await pearsService.initialize();

      const backendUserId = pearsService.getCurrentUserId();
      if (!backendUserId) {
        throw new Error('Failed to get backend user ID');
      }

      await pearsService.setUserProfile({
        name: userName.trim(),
        createdAt: Date.now(),
      });

      UserProfileStorage.setUserProfile({
        id: backendUserId,
        name: userName.trim(),
        createdAt: Date.now(),
        isProfileCompleted: true,
      });
      navigation.navigate('UsersList');
    } catch (error) {
      console.error('❌ [SETUP] Setup failed:', error);
      Alert.alert('Error', 'Failed to initialize user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Typography variant="heading1" style={styles.title}>
            Welcome to Whisper P2P! 👋
          </Typography>

          <Typography variant="body" style={styles.subtitle}>
            Let's set up your profile to start chatting with peers
          </Typography>

          <TextInput
            label="Your Name"
            placeholder="Enter your display name"
            value={userName}
            onChangeText={setUserName}
            maxLength={50}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSetupComplete}
            containerStyle={styles.inputContainer}
          />

          <Button
            onPress={handleSetupComplete}
            disabled={!userName.trim() || isLoading}
            style={styles.button}
          >
            <Typography variant="button" color="inverse">
              {isLoading ? 'Setting up...' : 'Get Started'}
            </Typography>
          </Button>

          <Typography variant="caption" style={styles.note}>
            Your persistent P2P identity will be created by the backend
          </Typography>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 3,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl * 2,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  button: {
    marginBottom: theme.spacing.lg,
  },
  note: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
}));
