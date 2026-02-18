import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors, spacing, createTypography } from '../../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      <Text style={[typography.bodySmall, styles.message]}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 120,
  },
});
