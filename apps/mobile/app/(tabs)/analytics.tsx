import React, { useState, useMemo } from 'react';
import { ScrollView, RefreshControl, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/layout';
import { LoadingScreen, EmptyState } from '../../src/components/ui';
import {
  PeriodSelector,
  getDateRange,
  SummaryCards,
  MonthlySpendingChart,
  CategoryBreakdownChart,
  TopJobsList,
  TopMerchantsList,
  BudgetHealthCard,
  ProfitabilityCard,
} from '../../src/components/analytics';
import type { Period } from '../../src/components/analytics';
import { useAnalyticsSummary, useJobProfitability } from '../../src/hooks/useAnalytics';
import { useTheme, type ThemeColors, createTypography, spacing } from '../../src/theme';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const [period, setPeriod] = useState<Period>('month');
  const dateRange = useMemo(() => getDateRange(period), [period]);

  const { data, isLoading, refetch, isRefetching } = useAnalyticsSummary(dateRange);
  const profitability = useJobProfitability(dateRange);

  if (isLoading) return <LoadingScreen />;

  const hasData =
    data &&
    (data.totals.expenseCount > 0 ||
      data.totals.tripCount > 0 ||
      data.totals.receiptCount > 0);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.heading}>Analytics</Text>

        <PeriodSelector selected={period} onSelect={setPeriod} />

        {hasData ? (
          <>
            <SummaryCards totals={data.totals} comparison={data.periodComparison} />
            <MonthlySpendingChart data={data.monthlySpending} />
            <CategoryBreakdownChart data={data.categoryBreakdown} />
            {data.budgetHealth && data.budgetHealth.jobs.length > 0 && (
              <BudgetHealthCard data={data.budgetHealth} />
            )}
            {profitability.data && profitability.data.jobs.length > 0 && (
              <ProfitabilityCard data={profitability.data} />
            )}
            <TopJobsList data={data.topJobs} />
            {data.topMerchants && data.topMerchants.length > 0 && (
              <TopMerchantsList data={data.topMerchants} />
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Data Yet"
              message="Start tracking expenses, mileage, and receipts to see your analytics here."
            />
          </View>
        )}

        {/* P&L Report link */}
        <TouchableOpacity
          style={styles.taxLink}
          onPress={() => router.push('/reports/pnl')}
          activeOpacity={0.7}
        >
          <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
          <Text style={styles.taxLinkText}>Profit & Loss Report</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Tax summary link */}
        <TouchableOpacity
          style={styles.taxLink}
          onPress={() => router.push('/tax-summary')}
          activeOpacity={0.7}
        >
          <Ionicons name="calculator-outline" size={20} color={colors.primary} />
          <Text style={styles.taxLinkText}>View Tax Summary</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  taxLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  taxLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
