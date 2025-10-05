import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { UserProfileStorage } from '@/services/storageService';
import { pearsService } from '@/services/pearsService';
import { RootStackParamList } from '@/navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface UserData {
  id: string;
  name: string;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (pearsService.initialized) {
        const userProfile = await pearsService.getUserProfile();
        setUserData(userProfile.profile);

        const userId = pearsService.getCurrentUserId();
        setCurrentUserId(userId);
      } else {
        await pearsService.initialize();

        const userProfile = await pearsService.getUserProfile();
        const userId = pearsService.getCurrentUserId();

        setUserData(userProfile.profile);
        setCurrentUserId(userId);
      }
    } catch (error) {
      setUserData(null);
      setCurrentUserId(null);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will remove all data including user profile, chats, and connections. You will need to restart the app. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (pearsService.initialized) {
                const resetResult = await pearsService.resetAllData();
                if (!resetResult.success) {
                  throw new Error(`Backend reset failed: ${resetResult.error}`);
                }
              }

              UserProfileStorage.clearUserProfile();

              setUserData(null);
              setCurrentUserId(null);

              Alert.alert(
                'Reset Complete',
                'All data has been cleared. Please restart the app.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                `Failed to reset data: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
            }
          },
        },
      ]
    );
  };

  const renderInfoItem = (label: string, value: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.infoItem} onPress={onPress} disabled={!onPress}>
      <Typography variant="caption" style={styles.infoLabel}>
        {label}
      </Typography>
      <Typography
        variant="body"
        style={[styles.infoValue, onPress && styles.infoValueClickable]}
      >
        {value}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Typography variant="button">← Back</Typography>
        </Button>
        <Typography variant="heading2">Settings</Typography>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Typography variant="heading3" style={styles.sectionTitle}>
            Profile
          </Typography>

          {renderInfoItem('Username', userData?.name || 'Unknown')}
          {renderInfoItem(
            'User ID',
            currentUserId ? currentUserId.slice(0, 16) + '...' : 'N/A',
            currentUserId
              ? () => {
                  Alert.alert('User ID (Public Key)', currentUserId, [
                    { text: 'Close' },
                  ]);
                }
              : undefined
          )}
        </View>

        <View style={styles.section}>
          <Button variant="danger" onPress={handleClearAllData}>
            <Typography variant="button" color="inverse">
              Reset All Data
            </Typography>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: rt.insets.top + theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    paddingHorizontal: 0,
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: rt.insets.bottom + theme.spacing.lg,
  },
  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.otherMessage,
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    color: theme.colors.text,
  },
  infoValueClickable: {
    color: theme.colors.primary,
  },
}));
