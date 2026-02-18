import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../src/components/layout';
import { Card, Button, LoadingScreen, EmptyState } from '../src/components/ui';
import { useTaxSummary } from '../src/hooks/useAnalytics';
import { exportTaxSummary } from '../src/lib/export';
import { formatMoney } from '../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../src/theme';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function TaxSummaryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [year, setYear] = useState(CURRENT_YEAR);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useTaxSummary(year);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportTaxSummary(year);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export tax summary.');
    } finally {
      setExporting(false);
    }
  }, [year]);

  if (isLoading) return <LoadingScreen />;

  const hasData = data && (
    data.taxCategoryBreakdown.length > 0 ||
    data.mileage.totalMiles > 0
  );

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
          {YEAR_OPTIONS.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, year === y && styles.yearChipActive]}
              onPress={() => setYear(y)}
            >
              <Text style={[styles.yearChipText, year === y && styles.yearChipTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {hasData && data ? (
          <>
            {/* Grand totals card */}
            <View style={styles.totalsCard}>
              <Ionicons name="calculator-outline" size={28} color={colors.primary} />
              <Text style={styles.totalsLabel}>Total Deductions</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(data.totals.grandTotal)}
              </Text>
              <View style={styles.totalsBreakdown}>
                <View style={styles.totalsItem}>
                  <Text style={styles.totalsItemLabel}>Expenses</Text>
                  <Text style={styles.totalsItemValue}>
                    {formatMoney(data.totals.totalExpenseDeductions)}
                  </Text>
                </View>
                <View style={styles.totalsDivider} />
                <View style={styles.totalsItem}>
                  <Text style={styles.totalsItemLabel}>Mileage</Text>
                  <Text style={styles.totalsItemValue}>
                    {formatMoney(data.totals.totalMileageDeductions)}
                  </Text>
                </View>
              </View>
              <View style={styles.savingsRow}>
                <Ionicons name="trending-down-outline" size={16} color={colors.success} />
                <Text style={styles.savingsText}>
                  Est. SE tax savings: {formatMoney(data.totals.estimatedSETaxSavings)}
                </Text>
              </View>
            </View>

            {/* Schedule C breakdown */}
            {data.taxCategoryBreakdown.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Schedule C Breakdown</Text>
                {data.taxCategoryBreakdown.map((cat) => (
                  <View key={cat.taxCategory} style={styles.categoryCard}>
                    <Card style={styles.categoryCardInner}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.categoryLine}>{cat.scheduleLine}</Text>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        <Text style={styles.categoryCount}>
                          {cat.count} expense{cat.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text style={styles.categoryTotal}>{formatMoney(cat.total)}</Text>
                    </Card>
                  </View>
                ))}
              </>
            )}

            {/* Mileage section */}
            {data.mileage.totalMiles > 0 && (
              <>
                <Text style={styles.sectionTitle}>Mileage Deduction</Text>
                <View style={styles.mileageCardWrapper}>
                  <Card style={styles.mileageCard}>
                    <View style={styles.mileageRow}>
                      <View style={styles.mileageItem}>
                        <Text style={styles.mileageLabel}>Total Miles</Text>
                        <Text style={styles.mileageValue}>
                          {data.mileage.totalMiles.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.mileageItem}>
                        <Text style={styles.mileageLabel}>IRS Rate</Text>
                        <Text style={styles.mileageValue}>
                          ${data.mileage.ratePerMile}/mi
                        </Text>
                      </View>
                      <View style={styles.mileageItem}>
                        <Text style={styles.mileageLabel}>Deduction</Text>
                        <Text style={[styles.mileageValue, { color: colors.success }]}>
                          {formatMoney(data.mileage.totalDeduction)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </View>
              </>
            )}

            {/* Export button */}
            <View style={styles.exportContainer}>
              <Button
                title={`Export ${year} Tax Summary`}
                onPress={handleExport}
                loading={exporting}
                variant="secondary"
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Tax Data"
              message={`No expenses or mileage recorded for ${year}. Start tracking to see your tax summary.`}
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
  yearChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  yearChipTextActive: {
    color: colors.white,
  },
  totalsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  totalsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  totalsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  totalsBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  totalsItem: {
    alignItems: 'center',
  },
  totalsItemLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  totalsItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  totalsDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
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
  categoryCard: {
    paddingHorizontal: spacing.lg,
  },
  categoryCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  categoryLine: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  mileageCardWrapper: {
    paddingHorizontal: spacing.lg,
  },
  mileageCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  mileageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mileageItem: {
    alignItems: 'center',
  },
  mileageLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  mileageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  exportContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
