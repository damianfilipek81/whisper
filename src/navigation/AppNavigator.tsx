import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserSetupScreen } from '@/screens/UserSetupScreen';
import { UsersListScreen } from '@/screens/UsersListScreen';
import { AddPeerScreen } from '@/screens/AddPeerScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { VoiceSettingsScreen } from '@/screens/VoiceSettingsScreen';
import { ChatScreen } from '@/components/ChatScreen';
import { PeerConnection } from '@/types';
import { UserProfileStorage } from '@/services/storageService';

export type RootStackParamList = {
  UserSetup: undefined;
  UsersList: undefined;
  AddPeer: undefined;
  Settings: undefined;
  Chat: { peer: PeerConnection; chatId: string };
  VoiceSettings: { chatId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const isSetupComplete = UserProfileStorage.getUserProfile()?.isProfileCompleted;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
        initialRouteName={isSetupComplete ? 'UsersList' : 'UserSetup'}
      >
        <Stack.Group>
          <Stack.Screen name="UserSetup" component={UserSetupScreen} />
          <Stack.Screen name="UsersList" component={UsersListScreen} />
          <Stack.Screen name="AddPeer" component={AddPeerScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Group>
        <Stack.Group
          screenOptions={{
            presentation: 'modal',
            gestureEnabled: true,
            cardOverlayEnabled: true,
            headerShown: false,
          }}
        >
          <Stack.Screen name="VoiceSettings" component={VoiceSettingsScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
