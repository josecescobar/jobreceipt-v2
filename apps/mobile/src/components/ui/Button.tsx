import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeColors, spacing, borderRadius, MIN_TOUCH_TARGET } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.primary : colors.white}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_${size}`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: MIN_TOUCH_TARGET,
      borderRadius: borderRadius.md,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.error,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    disabled: {
      opacity: 0.5,
    },
    size_sm: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 36,
    },
    size_md: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    size_lg: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    text: {
      fontWeight: '600',
      textAlign: 'center',
    },
    text_primary: {
      color: colors.white,
    },
    text_secondary: {
      color: colors.text,
    },
    text_danger: {
      color: colors.white,
    },
    text_ghost: {
      color: colors.primary,
    },
    text_sm: {
      fontSize: 14,
    },
    text_md: {
      fontSize: 16,
    },
    text_lg: {
      fontSize: 18,
    },
  });
