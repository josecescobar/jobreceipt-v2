import React, { useState, useMemo } from 'react';
import { ScrollView, RefreshControl, Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../src/components/layout';
import { LoadingScreen, EmptyState } from '../../src/components/ui';
import {
  PeriodSelector,
  getDateRange,
  SummaryCards,
  MonthlySpendingChart,
  CategoryBreakdownChart,
  TopJobsList,
} from '../../src/components/analytics';
import type { Period } from '../../src/components/analytics';
import { useAnalyticsSummary } from '../../src/hooks/useAnalytics';
import { colors, spacing, typography } from '../../src/theme';

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const dateRange = useMemo(() => getDateRange(period), [period]);

  const { data, isLoading, refetch, isRefetching } = useAnalyticsSummary(dateRange);

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
            <SummaryCards totals={data.totals} />
            <MonthlySpendingChart data={data.monthlySpending} />
            <CategoryBreakdownChart data={data.categoryBreakdown} />
            <TopJobsList data={data.topJobs} />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Data Yet"
              message="Start tracking expenses, mileage, and receipts to see your analytics here."
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.h1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
