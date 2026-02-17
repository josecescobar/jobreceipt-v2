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
import { Screen } from '../../src/components/layout';
import { Card, ProgressBar } from '../../src/components/ui';
import { QuickActionGrid, ActivityFeed } from '../../src/components/dashboard';
import type { QuickAction, ActivityItem } from '../../src/components/dashboard';
import { useRecentReceipts, useReceipts } from '../../src/hooks/useReceipts';
import { useJobs } from '../../src/hooks/useJobs';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useMileageSummary, useMileageTrips } from '../../src/hooks/useMileage';
import { useBudget } from '../../src/hooks/useBudget';
import { formatMoney } from '../../src/lib/format';
import { colors, spacing, typography, borderRadius } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Scan Receipt', icon: 'camera', route: '/capture', color: colors.primary },
  { label: 'Add Expense', icon: 'wallet', route: '/expense/create', color: colors.success },
  { label: 'Log Mileage', icon: 'car', route: '/mileage/create', color: colors.warning },
  { label: 'New Job', icon: 'briefcase', route: '/job/create', color: colors.textSecondary },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const allExpenses = useMemo(
    () => expensesData?.pages?.flatMap((p) => p.data) ?? [],
    [expensesData],
  );

  const { data: mileageData } = useMileageTrips({ limit: 5 });
  const recentMileage = useMemo(
    () => mileageData?.pages?.flatMap((p) => p.data) ?? [],
    [mileageData],
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const monthExpenseTotal = useMemo(
    () =>
      allExpenses
        .filter((e) => new Date(e.date) >= monthStart)
        .reduce((sum, e) => sum + e.amount, 0),
    [allExpenses],
  );

  const monthMileageTotal = mileageSummary?.totalDeduction ?? 0;
  const monthTotal = monthExpenseTotal + monthMileageTotal;

  // Build job name map for expense activity items
  const jobNameMap = useMemo(
    () => Object.fromEntries(activeJobs.map((j) => [j.id, j.name])),
    [activeJobs],
  );

  // Merge recent activity
  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    for (const r of recentReceipts) {
      items.push({
        type: 'receipt',
        id: r.id,
        date: (r.transactionDate ?? r.createdAt)?.toString() ?? '',
        merchantName: r.merchantName,
        totalAmount: r.totalAmount,
        status: r.status,
      });
    }

    for (const e of allExpenses.slice(0, 5)) {
      items.push({
        type: 'expense',
        id: e.id,
        date: e.date?.toString() ?? '',
        description: e.description,
        amount: e.amount,
        jobName: e.jobId ? jobNameMap[e.jobId] : undefined,
      });
    }

    for (const m of recentMileage) {
      items.push({
        type: 'mileage',
        id: m.id,
        date: m.date?.toString() ?? '',
        distanceMiles: m.distanceMiles,
        totalDeduction: m.totalDeduction,
        purpose: m.purpose ?? null,
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 10);
  }, [recentReceipts, allExpenses, recentMileage, jobNameMap]);

  const topJob = activeJobs[0];
  const topJobBudget = useBudget(topJob?.id ?? '');

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hi, {firstName}</Text>
        <Text style={styles.subGreeting}>Here's your business overview</Text>

        {/* Quick Actions */}
        <QuickActionGrid actions={QUICK_ACTIONS} />

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
            <Text style={styles.statLabel}>{monthLabel}</Text>
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

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <ActivityFeed items={activityItems} />

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
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
