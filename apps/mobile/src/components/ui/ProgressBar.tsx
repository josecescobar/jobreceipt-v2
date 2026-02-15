import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../theme';
import { getBudgetColor } from '../../theme/colors';

interface ProgressBarProps {
  spent: number;
  budget: number;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ spent, budget, height = 8, style }: ProgressBarProps) {
  const ratio = budget > 0 ? Math.min(spent / budget, 1.2) : 0;
  const width = `${Math.min(ratio * 100, 100)}%`;
  const barColor = getBudgetColor(spent, budget);

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          { width: width as any, backgroundColor: barColor, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
