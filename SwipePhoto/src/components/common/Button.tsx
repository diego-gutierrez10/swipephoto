import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../layout/ThemeProvider';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors, spacing, typography } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size-specific styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        height: 36,
        paddingHorizontal: spacing.md,
      },
      md: {
        height: 48,
        paddingHorizontal: spacing.lg,
      },
      lg: {
        height: 56,
        paddingHorizontal: spacing.xl,
      },
    };

    // Variant-specific styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: colors.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...((disabled || loading) && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size-specific text styles
    const sizeTextStyles: Record<string, TextStyle> = {
      sm: typography.button.sm,
      md: typography.button.base,
      lg: typography.button.lg,
    };

    // Variant-specific text colors
    const variantTextColors: Record<string, string> = {
      primary: colors.background, // Dark text on bright background
      secondary: colors.background,
      outline: colors.primary,
      ghost: colors.primary,
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      color: variantTextColors[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID="button"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' 
            ? colors.background 
            : colors.primary
          }
          testID="button-loading-indicator"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button; 