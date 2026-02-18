import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, createTypography, spacing, MIN_TOUCH_TARGET } from '../../theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function Header({ title, showBack = false, rightAction }: HeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.actionButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name={rightAction.icon} size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: ReturnType<typeof createTypography>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 56,
    },
    left: {
      width: 40,
    },
    right: {
      width: 40,
      alignItems: 'flex-end',
    },
    title: {
      ...typography.h3,
      flex: 1,
      textAlign: 'center',
    },
    backButton: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
    },
    actionButton: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
  });
