import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { formatMoney } from '../../lib/format';

interface OverBudgetBannerProps {
  overBy: number; // cents over budget
}

export function OverBudgetBanner({ overBy }: OverBudgetBannerProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="warning" size={20} color={colors.white} />
      <Text style={styles.text}>
        Over budget by {formatMoney(overBy)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
