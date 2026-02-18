import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Screen, Header } from '../src/components/layout';
import { FilterChip, LoadingScreen, EmptyState } from '../src/components/ui';
import { CategoryBreakdownChart } from '../src/components/analytics';
import { useAnalyticsSummary } from '../src/hooks/useAnalytics';
import { useSettings } from '../src/hooks/useSettings';
import { formatMoney } from '../src/lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear];

export default function TaxSummaryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const taxRate = useSettings((s) => s.defaultTaxRate);

  const dateRange = useMemo(
    () => ({
      startDate: new Date(selectedYear, 0, 1).toISOString(),
      endDate: new Date(selectedYear, 11, 31, 23, 59, 59).toISOString(),
    }),
    [selectedYear],
  );

  const { data, isLoading, refetch, isRefetching } = useAnalyticsSummary(dateRange);

  if (isLoading) return <LoadingScreen />;

  const totals = data?.totals;
  const totalDeductible = (totals?.totalExpenses ?? 0) + (totals?.totalMileageDeductions ?? 0);
  const estimatedSavings = taxRate > 0 ? Math.round(totalDeductible * (taxRate / 100)) : 0;
  const hasData = totals && (totals.expenseCount > 0 || totals.tripCount > 0);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Tax Summary" showBack />

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
        {/* Year selector */}
        <View style={styles.yearRow}>
          {YEARS.map((year) => (
            <FilterChip
              key={year}
              label={year.toString()}
              active={selectedYear === year}
              onPress={() => setSelectedYear(year)}
            />
          ))}
        </View>

        {hasData ? (
          <>
            {/* Tax savings card */}
            <View style={styles.savingsCard}>
              <Ionicons name="calculator-outline" size={28} color={colors.primary} />
              <Text style={styles.savingsLabel}>Total Deductible</Text>
              <Text style={styles.savingsAmount}>{formatMoney(totalDeductible)}</Text>
              {taxRate > 0 ? (
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>
                    Estimated Tax Savings ({taxRate}%)
                  </Text>
                  <Text style={styles.estimateAmount}>
                    {formatMoney(estimatedSavings)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noRateHint}>
                  Set your tax rate in Settings → Preferences
                </Text>
              )}
            </View>

            {/* Totals row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatMoney(totals.totalExpenses)}</Text>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={styles.statCount}>{totals.expenseCount} total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {formatMoney(totals.totalMileageDeductions)}
                </Text>
                <Text style={styles.statLabel}>Mileage</Text>
                <Text style={styles.statCount}>{totals.tripCount} trips</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totals.receiptCount}</Text>
                <Text style={styles.statLabel}>Receipts</Text>
              </View>
            </View>

            {/* Category breakdown */}
            {data.categoryBreakdown.length > 0 && (
              <CategoryBreakdownChart data={data.categoryBreakdown} />
            )}

            {/* Mileage summary */}
            {totals.tripCount > 0 && (
              <View style={styles.mileageCard}>
                <View style={styles.mileageHeader}>
                  <Ionicons name="car" size={20} color={colors.warning} />
                  <Text style={styles.mileageTitle}>Mileage Deductions</Text>
                </View>
                <View style={styles.mileageRow}>
                  <View style={styles.mileageStat}>
                    <Text style={styles.mileageStatValue}>{totals.tripCount}</Text>
                    <Text style={styles.mileageStatLabel}>Trips</Text>
                  </View>
                  <View style={styles.mileageStat}>
                    <Text style={[styles.mileageStatValue, { color: colors.success }]}>
                      {formatMoney(totals.totalMileageDeductions)}
                    </Text>
                    <Text style={styles.mileageStatLabel}>Deduction</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Data"
              message={`No expenses or mileage recorded for ${selectedYear}.`}
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
  yearRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  savingsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  savingsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  savingsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xs,
  },
  estimateRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    width: '100%',
  },
  estimateLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  estimateAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  noRateHint: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statCount: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  mileageCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mileageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mileageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  mileageRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  mileageStat: {
    flex: 1,
    alignItems: 'center',
  },
  mileageStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  mileageStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
