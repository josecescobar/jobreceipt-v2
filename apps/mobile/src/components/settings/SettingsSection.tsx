import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors, spacing, borderRadius, createTypography } from '../../theme';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={[typography.label, styles.title]}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
