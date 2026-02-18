import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { Card } from '../../src/components/ui';
import { usePnlReport } from '../../src/hooks/usePnl';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const PERIODS = [
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
] as const;

export default function PnlScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [period, setPeriod] = useState<string>('month');

  const { data: report, isLoading, refetch } = usePnlReport({ period });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <Screen padded={false}>
      <Header title="Profit & Loss" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodChip, period === p.value && styles.periodChipActive]}
              onPress={() => setPeriod(p.value)}
            >
              <Text
                style={[styles.periodChipText, period === p.value && styles.periodChipTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && !report ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : report ? (
          <>
            {/* Period label */}
            <Text style={styles.periodLabel}>{report.period.label}</Text>

            {/* Summary card */}
            <Card>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Revenue</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {formatMoney(report.income.total)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={[styles.summaryValue, { color: colors.error }]}>
                    {formatMoney(report.expenses.total)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Mileage</Text>
                  <Text style={[styles.summaryValue, { color: colors.warning }]}>
                    {formatMoney(report.mileageDeductions)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Net Profit</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      styles.summaryValueLarge,
                      { color: report.netProfit >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {report.netProfit >= 0 ? '' : '-'}
                    {formatMoney(Math.abs(report.netProfit))}
                  </Text>
                </View>
              </View>

              {/* Margin + comparison */}
              <View style={styles.marginRow}>
                <View style={styles.marginBadge}>
                  <Text style={styles.marginText}>
                    {report.profitMargin.toFixed(1)}% margin
                  </Text>
                </View>
                {report.comparison && (
                  <View
                    style={[
                      styles.comparisonBadge,
                      {
                        backgroundColor:
                          report.comparison.changePercent >= 0
                            ? colors.success + '15'
                            : colors.error + '15',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        report.comparison.changePercent >= 0
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={14}
                      color={
                        report.comparison.changePercent >= 0
                          ? colors.success
                          : colors.error
                      }
                    />
                    <Text
                      style={[
                        styles.comparisonText,
                        {
                          color:
                            report.comparison.changePercent >= 0
                              ? colors.success
                              : colors.error,
                        },
                      ]}
                    >
                      {report.comparison.changePercent >= 0 ? '+' : ''}
                      {report.comparison.changePercent.toFixed(1)}% vs prev
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Income by Job */}
            {report.income.byJob.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Income by Job</Text>
                <Card>
                  {report.income.byJob.map((item, index) => (
                    <View
                      key={item.jobId}
                      style={[styles.breakdownRow, index > 0 && styles.breakdownBorder]}
                    >
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {item.jobName}
                        </Text>
                      </View>
                      <Text style={[styles.breakdownAmount, { color: colors.success }]}>
                        {formatMoney(item.amount)}
                      </Text>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Expenses by Category */}
            {report.expenses.byCategory.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Expenses by Category</Text>
                <Card>
                  {report.expenses.byCategory.map((item, index) => (
                    <View
                      key={item.category}
                      style={[styles.breakdownRow, index > 0 && styles.breakdownBorder]}
                    >
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownName}>{item.category}</Text>
                        <Text style={styles.breakdownPct}>{item.percentage.toFixed(1)}%</Text>
                      </View>
                      <Text style={styles.breakdownAmount}>{formatMoney(item.amount)}</Text>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Expenses by Job */}
            {report.expenses.byJob.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Expenses by Job</Text>
                <Card>
                  {report.expenses.byJob.map((item, index) => (
                    <View
                      key={item.jobId}
                      style={[styles.breakdownRow, index > 0 && styles.breakdownBorder]}
                    >
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {item.jobName}
                        </Text>
                      </View>
                      <Text style={styles.breakdownAmount}>{formatMoney(item.amount)}</Text>
                    </View>
                  ))}
                </Card>
              </>
            )}
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxl },
    periodRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    periodChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    periodChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    periodChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    periodChipTextActive: { color: colors.white },
    periodLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    summaryItem: {
      width: '45%',
      marginBottom: spacing.sm,
    },
    summaryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
    summaryValue: {
      fontSize: 18,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    summaryValueLarge: { fontSize: 22 },
    marginRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    marginBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.textMuted + '15',
    },
    marginText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    comparisonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    comparisonText: { fontSize: 13, fontWeight: '600' },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    breakdownBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    breakdownInfo: { flex: 1 },
    breakdownName: { fontSize: 15, fontWeight: '500', color: colors.text },
    breakdownPct: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    breakdownAmount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    bottomSpacer: { height: spacing.xxxl },
  });
