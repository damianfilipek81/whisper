import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';

export type TextInputVariant = 'default' | 'multiline';
export type TextInputSize = 'small' | 'medium' | 'large';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  variant?: TextInputVariant;
  size?: TextInputSize;
  label?: string;
  error?: string;
  fullWidth?: boolean;
  style?: RNTextInputProps['style'];
  containerStyle?: RNTextInputProps['style'];
}

export const TextInput: React.FC<TextInputProps> = ({
  variant = 'default',
  size = 'medium',
  label,
  error,
  fullWidth = true,
  style,
  containerStyle,
  ...props
}) => {
  const isMultiline = variant === 'multiline';

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth, containerStyle]}>
      {label && (
        <Typography variant="caption" color="secondary" style={styles.label}>
          {label}
        </Typography>
      )}
      <RNTextInput
        style={[
          styles.base,
          styles[`size_${size}`],
          isMultiline && styles.multiline,
          error && styles.error,
          style,
        ]}
        placeholderTextColor={styles.placeholder.color}
        multiline={isMultiline}
        textAlignVertical={isMultiline ? 'top' : 'center'}
        {...props}
      />
      {error && (
        <Typography variant="caption" color="error" style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  base: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage,
    fontFamily: 'System',
  },
  placeholder: {
    color: theme.colors.textSecondary,
  },

  // Sizes
  size_small: {
    paddingVertical: theme.spacing.xs,
    minHeight: 36,
  },
  size_medium: {
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  size_large: {
    paddingVertical: theme.spacing.lg,
    minHeight: 52,
  },

  // Variants
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },

  // States
  error: {
    borderColor: '#F44336',
  },
  errorText: {
    marginTop: theme.spacing.xs,
  },
}));
