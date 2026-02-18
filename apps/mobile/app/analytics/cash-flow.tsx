import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { Card, LoadingScreen, EmptyState } from '../../src/components/ui';
import { useCashFlowForecast } from '../../src/hooks/useCashFlow';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { CashFlowPeriod } from '@jobreceipt/shared';

export default function CashFlowScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data, isLoading, refetch, isRefetching } = useCashFlowForecast();

  if (isLoading) return <LoadingScreen />;

  const hasData = data && data.periods.length > 0;

  // Find the max value across all inflows/outflows for proportional bar width
  const maxAmount = useMemo(() => {
    if (!data) return 1;
    let max = 1;
    for (const p of data.periods) {
      if (p.expectedInflows > max) max = p.expectedInflows;
      if (p.expectedOutflows > max) max = p.expectedOutflows;
    }
    return max;
  }, [data]);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Cash Flow Forecast" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {hasData && data ? (
          <>
            {/* Current Balance Card */}
            <View style={styles.balanceCard}>
              <Ionicons name="wallet-outline" size={28} color={colors.primary} />
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: data.currentBalance >= 0 ? colors.text : colors.error },
                ]}
              >
                {formatMoney(data.currentBalance)}
              </Text>
            </View>

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: colors.success + '40' }]}>
                <Ionicons name="arrow-down-outline" size={18} color={colors.success} />
                <Text style={styles.summaryLabel}>Expected In</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatMoney(data.summary.totalExpectedIn)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: colors.error + '40' }]}>
                <Ionicons name="arrow-up-outline" size={18} color={colors.error} />
                <Text style={styles.summaryLabel}>Expected Out</Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>
                  {formatMoney(data.summary.totalExpectedOut)}
                </Text>
              </View>
            </View>

            {/* Forecast Chart */}
            <Text style={styles.sectionTitle}>Monthly Overview</Text>
            <View style={styles.chartContainer}>
              {data.periods.map((period) => (
                <View key={period.month} style={styles.chartRow}>
                  <Text style={styles.chartMonth}>{period.month}</Text>
                  <View style={styles.chartBars}>
                    {/* Inflow bar */}
                    <View style={styles.barRow}>
                      <View
                        style={[
                          styles.bar,
                          styles.barInflow,
                          {
                            width: maxAmount > 0
                              ? `${Math.max((period.expectedInflows / maxAmount) * 100, period.expectedInflows > 0 ? 3 : 0)}%`
                              : '0%',
                            backgroundColor: colors.success,
                          },
                        ]}
                      />
                    </View>
                    {/* Outflow bar */}
                    <View style={styles.barRow}>
                      <View
                        style={[
                          styles.bar,
                          styles.barOutflow,
                          {
                            width: maxAmount > 0
                              ? `${Math.max((period.expectedOutflows / maxAmount) * 100, period.expectedOutflows > 0 ? 3 : 0)}%`
                              : '0%',
                            backgroundColor: colors.error,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.chartNetFlow,
                      { color: period.netFlow >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {period.netFlow >= 0 ? '+' : ''}{formatMoney(period.netFlow)}
                  </Text>
                </View>
              ))}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Inflows</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={styles.legendText}>Outflows</Text>
                </View>
              </View>
            </View>

            {/* Period Detail List */}
            <Text style={styles.sectionTitle}>Monthly Details</Text>
            {data.periods.map((period, index) => (
              <View key={period.month} style={styles.periodCard}>
                <Card>
                  <Text style={styles.periodMonth}>{period.month}</Text>
                  <View style={styles.periodRow}>
                    <View style={styles.periodRowLeft}>
                      <Ionicons name="arrow-down-circle-outline" size={16} color={colors.success} />
                      <Text style={styles.periodRowLabel}>Expected In</Text>
                    </View>
                    <Text style={[styles.periodRowValue, { color: colors.success }]}>
                      {formatMoney(period.expectedInflows)}
                    </Text>
                  </View>
                  <View style={styles.periodRow}>
                    <View style={styles.periodRowLeft}>
                      <Ionicons name="arrow-up-circle-outline" size={16} color={colors.error} />
                      <Text style={styles.periodRowLabel}>Expected Out</Text>
                    </View>
                    <Text style={[styles.periodRowValue, { color: colors.error }]}>
                      {formatMoney(period.expectedOutflows)}
                    </Text>
                  </View>
                  <View style={styles.periodDivider} />
                  <View style={styles.periodRow}>
                    <View style={styles.periodRowLeft}>
                      <Ionicons
                        name={period.netFlow >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                        size={16}
                        color={period.netFlow >= 0 ? colors.success : colors.error}
                      />
                      <Text style={styles.periodRowLabel}>Net Flow</Text>
                    </View>
                    <Text
                      style={[
                        styles.periodRowValue,
                        styles.periodRowBold,
                        { color: period.netFlow >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {period.netFlow >= 0 ? '+' : ''}{formatMoney(period.netFlow)}
                    </Text>
                  </View>
                  <View style={styles.periodRow}>
                    <View style={styles.periodRowLeft}>
                      <Ionicons name="wallet-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.periodRowLabel}>Running Balance</Text>
                    </View>
                    <Text
                      style={[
                        styles.periodRowValue,
                        styles.periodRowBold,
                        { color: period.runningBalance >= 0 ? colors.text : colors.error },
                      ]}
                    >
                      {formatMoney(period.runningBalance)}
                    </Text>
                  </View>
                </Card>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Forecast Data"
              message="Add invoices and recurring expenses to generate a cash flow forecast."
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chartContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartMonth: {
    width: 72,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chartBars: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  barRow: {
    height: 8,
    marginVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barInflow: {},
  barOutflow: {},
  chartNetFlow: {
    width: 80,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  periodCard: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  periodMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  periodRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodRowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  periodRowValue: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  periodRowBold: {
    fontWeight: '600',
  },
  periodDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
