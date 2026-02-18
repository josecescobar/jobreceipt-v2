import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeeklyComparison } from '../../hooks/useAnalytics';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

export function WeeklySpendingCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading } = useWeeklyComparison();

  if (isLoading || !data) return null;

  const { thisWeek, lastWeek, changePercent } = data;
  const increased = changePercent !== null && changePercent > 0;
  const decreased = changePercent !== null && changePercent < 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly Spending</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>This Week</Text>
          <Text style={styles.columnValue}>{formatMoney(thisWeek)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Last Week</Text>
          <Text style={[styles.columnValue, styles.lastWeekValue]}>
            {formatMoney(lastWeek)}
          </Text>
        </View>
      </View>
      {changePercent !== null && (
        <View style={[styles.changeBadge, increased ? styles.increasedBadge : styles.decreasedBadge]}>
          <Ionicons
            name={increased ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={increased ? colors.error : colors.success}
          />
          <Text style={[styles.changeText, increased ? styles.increasedText : styles.decreasedText]}>
            {Math.abs(changePercent).toFixed(1)}% {increased ? 'more' : 'less'} than last week
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },
    columns: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    column: {
      flex: 1,
      alignItems: 'center',
    },
    divider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },
    columnLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    columnValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    lastWeekValue: {
      color: colors.textSecondary,
    },
    changeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 4,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    increasedBadge: {
      backgroundColor: colors.error + '15',
    },
    decreasedBadge: {
      backgroundColor: colors.success + '15',
    },
    changeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    increasedText: {
      color: colors.error,
    },
    decreasedText: {
      color: colors.success,
    },
  });
