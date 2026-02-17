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
import type { CategoryBreakdown } from '@jobreceipt/shared';

const CATEGORY_COLORS = [
  colors.primary,
  colors.success,
  colors.warning,
  '#8B5CF6',
  colors.error,
  '#60A5FA',
  '#EC4899',
  '#14B8A6',
];

const MAX_BAR_WIDTH_PERCENT = 55;

function AnimatedRow({
  item,
  maxPercentage,
  index,
  color,
}: {
  item: CategoryBreakdown;
  maxPercentage: number;
  index: number;
  color: string;
}) {
  const widthPercent =
    maxPercentage > 0
      ? (item.percentage / maxPercentage) * MAX_BAR_WIDTH_PERCENT
      : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withDelay(
      index * 100,
      withTiming(`${widthPercent}%` as any, { duration: 600 }),
    ),
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {item.category}
      </Text>
      <View style={styles.barContainer}>
        <Animated.View
          style={[styles.bar, { backgroundColor: color }, animatedStyle]}
        />
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.amount}>{formatMoney(item.total)}</Text>
        <Text style={styles.percent}>{item.percentage.toFixed(0)}%</Text>
      </View>
    </View>
  );
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) return null;

  const maxPercentage = Math.max(...data.map((d) => d.percentage), 1);

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>By Category</Text>
      {data.map((item, index) => (
        <AnimatedRow
          key={item.category}
          item={item}
          maxPercentage={maxPercentage}
          index={index}
          color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
        />
      ))}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryLabel: {
    width: 80,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  valueContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  percent: {
    fontSize: 10,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
