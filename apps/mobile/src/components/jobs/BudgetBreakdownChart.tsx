import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { getBudgetColor } from '../../theme/colors';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

interface BarData {
  label: string;
  spent: number;
  budget: number;
}

interface BudgetBreakdownChartProps {
  data: BarData[];
}

const BAR_HEIGHT = 120;

function AnimatedBar({ spent, budget, index }: { spent: number; budget: number; index: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ratio = budget > 0 ? Math.min(spent / budget, 1.2) : 0;
  const barColor = getBudgetColor(spent, budget, colors);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withDelay(index * 100, withTiming(ratio * BAR_HEIGHT, { duration: 600 })),
  }));

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[styles.barFill, { backgroundColor: barColor }, animatedStyle]}
      />
    </View>
  );
}

export function BudgetBreakdownChart({ data }: BudgetBreakdownChartProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <View key={item.label} style={styles.barContainer}>
            <AnimatedBar spent={item.spent} budget={item.budget} index={index} />
            <Text style={styles.barLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.barAmount}>
              {formatMoney(item.spent)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_HEIGHT + 50,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barTrack: {
    width: '100%',
    height: BAR_HEIGHT,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  barAmount: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
