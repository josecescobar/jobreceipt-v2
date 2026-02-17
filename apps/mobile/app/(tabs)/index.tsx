import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/layout';
import { Card, ProgressBar, Badge } from '../../src/components/ui';
import { ReceiptStatusBadge } from '../../src/components/receipt';
import { useRecentReceipts, useReceipts } from '../../src/hooks/useReceipts';
import { useJobs } from '../../src/hooks/useJobs';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useMileageSummary } from '../../src/hooks/useMileage';
import { useBudget } from '../../src/hooks/useBudget';
import { formatMoney, formatDate, formatMiles } from '../../src/lib/format';
import { colors, spacing, typography, borderRadius } from '../../src/theme';

const QUICK_ACTIONS = [
  { label: 'Scan Receipt', icon: 'camera' as const, route: '/capture', color: colors.primary },
  { label: 'Add Expense', icon: 'wallet' as const, route: '/expense/create', color: colors.success },
  { label: 'Log Mileage', icon: 'car' as const, route: '/mileage/create', color: colors.warning },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const firstName = user?.firstName || 'there';

  // Data hooks
  const { data: recentData } = useRecentReceipts();
  const recentReceipts = recentData?.data ?? [];

  const { data: reviewData } = useReceipts({ status: 'REVIEW' });
  const reviewCount = reviewData?.pages?.[0]?.total ?? 0;

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 10 });
  const activeJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const { data: mileageSummary } = useMileageSummary();

  const { data: expensesData } = useExpenses({ limit: 100 });
  const monthTotal = useMemo(() => {
    const allExpenses = expensesData?.pages?.flatMap((p) => p.data) ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return allExpenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expensesData]);

  const topJob = activeJobs[0];
  const topJobBudget = useBudget(topJob?.id ?? '');

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hi, {firstName}</Text>
        <Text style={styles.subGreeting}>Here's your business overview</Text>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.quickActionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending review banner */}
        {reviewCount > 0 && (
          <TouchableOpacity
            style={styles.reviewBanner}
            onPress={() => router.push('/(tabs)/receipts')}
            activeOpacity={0.7}
          >
            <View style={styles.reviewBannerLeft}>
              <Ionicons name="document-text" size={20} color={colors.review} />
              <Text style={styles.reviewBannerText}>
                {reviewCount} receipt{reviewCount !== 1 ? 's' : ''} pending review
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/jobs')}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/expenses')}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{formatMoney(monthTotal)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/mileage')}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>
              {formatMoney(mileageSummary?.totalDeduction ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Mileage</Text>
          </TouchableOpacity>
        </View>

        {/* Top job budget */}
        {topJob && topJobBudget.budget > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Job</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/job/${topJob.id}`)}
            >
              <Card>
                <Text style={styles.jobName}>{topJob.name}</Text>
                {topJob.customerName && (
                  <Text style={styles.jobCustomer}>{topJob.customerName}</Text>
                )}
                <View style={styles.jobBudgetRow}>
                  <Text style={styles.jobBudgetLabel}>
                    {formatMoney(topJobBudget.spent)} of {formatMoney(topJobBudget.budget)}
                  </Text>
                  <Text style={[styles.jobBudgetRemaining, { color: topJobBudget.color }]}>
                    {topJobBudget.remaining >= 0
                      ? `${formatMoney(topJobBudget.remaining)} left`
                      : `${formatMoney(Math.abs(topJobBudget.remaining))} over`}
                  </Text>
                </View>
                <ProgressBar
                  spent={topJobBudget.spent}
                  budget={topJobBudget.budget}
                />
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* Recent receipts */}
        <Text style={styles.sectionTitle}>Recent Receipts</Text>
        {recentReceipts.length === 0 ? (
          <Text style={styles.emptyText}>
            No receipts yet. Scan your first receipt to get started.
          </Text>
        ) : (
          recentReceipts.map((receipt) => (
            <TouchableOpacity
              key={receipt.id}
              style={styles.receiptRow}
              onPress={() => router.push(`/receipt/${receipt.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptMerchant} numberOfLines={1}>
                  {receipt.merchantName || 'Processing...'}
                </Text>
                <View style={styles.receiptSubRow}>
                  {receipt.transactionDate && (
                    <Text style={styles.receiptDate}>
                      {formatDate(receipt.transactionDate.toString())}
                    </Text>
                  )}
                  <ReceiptStatusBadge status={receipt.status} />
                </View>
              </View>
              <Text style={styles.receiptAmount}>
                {receipt.totalAmount != null ? formatMoney(receipt.totalAmount) : '—'}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.review + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.review + '40',
  },
  reviewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.review,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  sectionTitle: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  jobCustomer: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  jobBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  jobBudgetLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  jobBudgetRemaining: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  receiptInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  receiptMerchant: {
    fontSize: 14,
    color: colors.text,
  },
  receiptSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  receiptDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
