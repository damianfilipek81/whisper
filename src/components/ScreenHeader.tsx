import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  style?: any;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      {showBackButton ? (
        <Button
          variant="ghost"
          onPress={onBack}
          style={styles.backButton}
        >
          <Typography variant="button">← Back</Typography>
        </Button>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <Typography variant="heading3">{title}</Typography>
      
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    paddingHorizontal: 0,
  },
  placeholder: {
    width: 60,
  },
}));
