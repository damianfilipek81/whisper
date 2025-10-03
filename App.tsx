import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppInitialization } from './src/hooks/useAppInitialization';
import { UserProfileStorage } from '@/services/storageService';

export default function App() {
  const { isInitialized } = useAppInitialization();
  const isSetupComplete = UserProfileStorage.getUserProfile()?.isProfileCompleted;
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AppNavigator />
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
