import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, type ThemeColors, borderRadius } from '../../theme';
import { getBudgetColor } from '../../theme/colors';

interface ProgressBarProps {
  spent: number;
  budget: number;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ spent, budget, height = 8, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ratio = budget > 0 ? Math.min(spent / budget, 1.2) : 0;
  const width = `${Math.min(ratio * 100, 100)}%`;
  const barColor = getBudgetColor(spent, budget, colors);

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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
