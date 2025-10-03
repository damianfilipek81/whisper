import React from 'react';
import { View, ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends Omit<ViewProps, 'style'> {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewProps['style'];
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  subtitle,
  children,
  style,
  ...props
}) => {
  return (
    <View style={[styles.base, styles[`variant_${variant}`], style]} {...props}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Typography variant="heading3" style={styles.title}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body" color="secondary" style={styles.subtitle}>
              {subtitle}
            </Typography>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  base: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },

  // Variants
  variant_default: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
  },
  variant_elevated: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  variant_outlined: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage,
  },

  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
}));
