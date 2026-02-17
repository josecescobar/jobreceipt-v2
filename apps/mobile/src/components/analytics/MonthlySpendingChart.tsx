import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Card } from '../ui';
import { formatMoney } from '../../lib/format';
import { colors, spacing, borderRadius } from '../../theme';
import type { MonthlySpending } from '@jobreceipt/shared';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const BAR_HEIGHT = 120;

function AnimatedBar({ value, maxValue, index }: { value: number; maxValue: number; index: number }) {
  const ratio = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    height: withDelay(index * 80, withTiming(ratio * BAR_HEIGHT, { duration: 600 })),
  }));

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[styles.barFill, animatedStyle]}
      />
    </View>
  );
}

interface MonthlySpendingChartProps {
  data: MonthlySpending[];
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Monthly Spending</Text>
      <View style={styles.chart}>
        {data.map((item, index) => {
          const monthIndex = parseInt(item.month.split('-')[1], 10) - 1;
          const label = MONTH_LABELS[monthIndex] ?? item.month;

          return (
            <View key={item.month} style={styles.barContainer}>
              <AnimatedBar value={item.total} maxValue={maxTotal} index={index} />
              <Text style={styles.barLabel}>{label}</Text>
              <Text style={styles.barAmount}>
                {formatMoney(item.total)}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
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
    backgroundColor: colors.primary,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  barAmount: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
