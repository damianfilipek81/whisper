import React from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppInitialization } from './src/hooks/useAppInitialization';

export default function App() {
  useAppInitialization();
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AppNavigator />
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
