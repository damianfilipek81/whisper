import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
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
  createdAt: number;
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
        // Get user profile from backend
        const userProfile = await pearsService.getUserProfile();
        setUserData(userProfile.profile);

        // Get active chats count
        const response = await pearsService.getActiveChats();

        // Get current user ID (backend is source of truth)
        const userId = pearsService.getCurrentUserId();
        setCurrentUserId(userId);

        console.log('✅ [SETTINGS] Loaded user data from backend:', {
          userId: userId?.slice(0, 8) + '...',
          name: userProfile.profile?.name,
          activeChats: response.chats?.length || 0,
        });
      } else {
        // Initialize pearsService if needed
        console.log('🔄 [SETTINGS] Initializing pearsService...');
        await pearsService.initialize();

        // Retry data loading
        const userProfile = await pearsService.getUserProfile();
        const userId = pearsService.getCurrentUserId();

        setUserData(userProfile.profile);
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to load backend data:', error);
      setUserData(null);
      setCurrentUserId(null);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your local data including user profile and settings. P2P chat data is handled by the network layer. You will need to set up the app again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [SETTINGS] Starting complete data reset...');

              // 1. Reset ALL backend data (P2P chats, hypercores, connections)
              if (pearsService.initialized) {
                console.log('🗑️ [SETTINGS] Resetting P2P backend data...');
                const resetResult = await pearsService.resetAllData();
                if (!resetResult.success) {
                  throw new Error(`Backend reset failed: ${resetResult.error}`);
                }
              }

              UserProfileStorage.clearUserProfile();

              // 3. Reset UI state
              setUserData(null);
              setCurrentUserId(null);

              console.log('✅ [SETTINGS] Complete data reset successful');
              Alert.alert(
                'Reset Complete',
                'All data has been cleared including user identity, chats, and connections. Please RESTART the app to create a new user identity.',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (error) {
              console.error('❌ [SETTINGS] Error during complete reset:', error);
              Alert.alert(
                'Error',
                `Failed to reset all data: ${
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
      {/* Header */}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Typography variant="heading3" style={styles.sectionTitle}>
            User Profile
          </Typography>

          {renderInfoItem('User Name', userData?.name || 'Unknown')}
          {renderInfoItem(
            'User ID (Local)',
            userData?.id?.slice(0, 8) + '...' || 'N/A'
          )}
          {renderInfoItem(
            'User ID (P2P)',
            currentUserId ? currentUserId.slice(0, 8) + '...' : 'N/A'
          )}
          {renderInfoItem(
            'P2P Public Key',
            currentUserId ? currentUserId.slice(0, 16) + '...' : 'N/A',
            currentUserId
              ? () => {
                  Alert.alert('P2P Public Key', currentUserId, [
                    {
                      text: 'Copy',
                      onPress: () => {
                        /* Clipboard.setString(currentUserId) */
                      },
                    },
                    { text: 'Close' },
                  ]);
                }
              : undefined
          )}
          {renderInfoItem(
            'Created',
            userData?.createdAt
              ? new Date(userData.createdAt).toLocaleDateString()
              : 'N/A'
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Typography variant="heading3" style={styles.sectionTitle}>
            Data Management
          </Typography>

          <Button
            variant="ghost"
            onPress={handleClearAllData}
            style={[styles.actionButton, styles.dangerButton]}
          >
            <Typography variant="button" style={styles.dangerText}>
              ⚠️ Reset All Data
            </Typography>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.otherMessage,
    marginBottom: theme.spacing.sm,
  },
  settingText: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingSubtitle: {
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  actionButton: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  warningButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  warningText: {
    color: '#FF9800',
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  dangerText: {
    color: '#F44336',
  },
  bottomPadding: {
    height: theme.spacing.xl,
  },
}));
