import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export function Badge({
  label,
  color: colorProp,
  backgroundColor: bgProp,
}: BadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const textColor = colorProp ?? colors.text;
  const bgColor = bgProp ?? colors.surfaceLight;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
