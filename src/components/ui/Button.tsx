import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/components/ui/Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'circular';

export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  style?: TouchableOpacityProps['style'];
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const isCircular = variant === 'circular';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isCircular && styles.circular,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#000000'
          }
        />
      ) : (
        <>
          {icon && !children && icon}
          {icon && children && (
            <>
              {icon}
              <Typography
                variant="button"
                weight="semibold"
                color={getTextColor(variant)}
                style={{ marginLeft: 8 }}
              >
                {children}
              </Typography>
            </>
          )}
          {!icon && children && (
            <Typography
              variant="button"
              weight="semibold"
              color={getTextColor(variant)}
            >
              {children}
            </Typography>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return 'inverse' as const;
    case 'secondary':
    case 'ghost':
    case 'circular':
    default:
      return 'primary' as const;
  }
};

const styles = StyleSheet.create((theme) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Variants
  variant_primary: {
    backgroundColor: theme.colors.primary,
  },
  variant_secondary: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.otherMessage,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: '#F44336',
  },
  variant_circular: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 22,
  },

  // Sizes
  size_small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: 32,
  },
  size_medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },
  size_large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 52,
  },

  // Modifiers
  fullWidth: {
    width: '100%',
  },
  circular: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  disabled: {
    opacity: 0.5,
  },
}));
