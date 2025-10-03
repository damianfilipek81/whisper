import React from 'react';
import { Text, TextProps, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type TypographyVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'body'
  | 'bodyLarge'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button';

export type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'success'
  | 'error'
  | 'warning';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  iconLeft,
  iconRight,
  style,
  children,
  ...props
}) => {
  if (!iconLeft && !iconRight) {
    return (
      <Text
        style={[
          styles.base,
          styles[variant],
          styles[`weight_${weight}`],
          styles[`color_${color}`],
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
      <Text
        style={[
          styles.base,
          styles[variant],
          styles[`weight_${weight}`],
          styles[`color_${color}`],
          styles.textWithIcons,
        ]}
        {...props}
      >
        {children}
      </Text>
      {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  base: {
    fontFamily: 'System',
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
  textWithIcons: {
    flex: 0,
  },

  // Variants
  heading1: {
    fontSize: theme.fontSize.xxxl,
    lineHeight: 32,
  },
  heading2: {
    fontSize: theme.fontSize.xxl,
    lineHeight: 28,
  },
  heading3: {
    fontSize: theme.fontSize.xl,
    lineHeight: 24,
  },
  body: {
    fontSize: theme.fontSize.lg,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: theme.fontSize.xl,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: theme.fontSize.md,
    lineHeight: 18,
  },
  caption: {
    fontSize: theme.fontSize.sm,
    lineHeight: 16,
  },
  label: {
    fontSize: theme.fontSize.xs,
    lineHeight: 14,
  },
  button: {
    fontSize: theme.fontSize.lg,
    lineHeight: 20,
  },

  // Weights
  weight_normal: {
    fontWeight: theme.fontWeight.normal,
  },
  weight_medium: {
    fontWeight: theme.fontWeight.medium,
  },
  weight_semibold: {
    fontWeight: theme.fontWeight.semiBold,
  },
  weight_bold: {
    fontWeight: theme.fontWeight.bold,
  },

  // Colors
  color_primary: {
    color: theme.colors.text,
  },
  color_secondary: {
    color: theme.colors.textSecondary,
  },
  color_muted: {
    color: theme.colors.timestamp,
  },
  color_inverse: {
    color: theme.colors.cardBackground,
  },
  color_success: {
    color: '#4CAF50',
  },
  color_error: {
    color: '#F44336',
  },
  color_warning: {
    color: '#FF9800',
  },
}));
