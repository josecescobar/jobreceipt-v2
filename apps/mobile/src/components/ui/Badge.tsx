import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export function Badge({
  label,
  color = colors.text,
  backgroundColor = colors.surfaceLight,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
