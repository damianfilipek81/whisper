import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Typography variant="body" color="muted" style={styles.text}>
        {message}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  text: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
}));

