import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Screen } from '../../src/components/layout';
import { Card, ProgressBar } from '../../src/components/ui';
import {
  QuickActionGrid,
  ActivityFeed,
  SyncStatusCard,
  WeeklySpendingCard,
  UnpaidInvoicesCard,
  TemplateQuickAddRow,
} from '../../src/components/dashboard';
import { MonthlySpendingChart, CategoryBreakdownChart } from '../../src/components/analytics';
import type { QuickAction, ActivityItem } from '../../src/components/dashboard';
import { useRecentReceipts, useReceipts } from '../../src/hooks/useReceipts';
import { usePendingExpenseCount } from '../../src/hooks/useExpenses';
import { useAuthStore } from '../../src/stores/auth.store';
import { useJobs } from '../../src/hooks/useJobs';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useMileageSummary, useMileageTrips } from '../../src/hooks/useMileage';
import { useBudget } from '../../src/hooks/useBudget';
import { useAnalyticsSummary } from '../../src/hooks/useAnalytics';
import { useTodayAssignments } from '../../src/hooks/useCrewScheduling';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const firstName = user?.firstName || 'there';
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  const QUICK_ACTIONS: QuickAction[] = useMemo(() => [
    { label: 'Scan Receipt', icon: 'camera', route: '/capture', color: colors.primary },
    { label: 'Add Expense', icon: 'wallet', route: '/expense/create', color: colors.success },
    { label: 'Log Mileage', icon: 'car', route: '/mileage/create', color: colors.warning },
    { label: 'New Job', icon: 'briefcase', route: '/job/create', color: colors.textSecondary },
  ], [colors]);

  const [refreshing, setRefreshing] = useState(false);

  // Data hooks
  const { data: recentData, refetch: refetchRecent } = useRecentReceipts();
  const recentReceipts = recentData?.data ?? [];

  const { data: reviewData, refetch: refetchReview } = useReceipts({ status: 'REVIEW' });
  const reviewCount = reviewData?.pages?.[0]?.total ?? 0;

  const { data: jobsData, refetch: refetchJobs } = useJobs({ status: 'ACTIVE', limit: 10 });
  const activeJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const { data: mileageSummary, refetch: refetchMileageSummary } = useMileageSummary();
  const userRole = useAuthStore((s) => s.userRole);
  const { data: pendingData, refetch: refetchPending } = usePendingExpenseCount();
  const pendingExpenseCount = pendingData?.pages?.[0]?.total ?? 0;
  const canApprove = userRole === 'OWNER' || userRole === 'BOOKKEEPER';

  const { data: expensesData, refetch: refetchExpenses } = useExpenses({ limit: 100 });
  const allExpenses = useMemo(
    () => expensesData?.pages?.flatMap((p) => p.data) ?? [],
    [expensesData],
  );

  const { data: mileageData, refetch: refetchMileage } = useMileageTrips({ limit: 5 });
  const { data: analyticsSummary, refetch: refetchAnalytics } = useAnalyticsSummary();
  const { data: todaySchedule, refetch: refetchTodaySchedule } = useTodayAssignments();
  const recentMileage = useMemo(
    () => mileageData?.pages?.flatMap((p) => p.data) ?? [],
    [mileageData],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchRecent(),
        refetchReview(),
        refetchJobs(),
        refetchMileageSummary(),
        refetchExpenses(),
        refetchMileage(),
        refetchAnalytics(),
        refetchPending(),
        refetchTodaySchedule(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchRecent, refetchReview, refetchJobs, refetchMileageSummary, refetchExpenses, refetchMileage, refetchAnalytics, refetchPending, refetchTodaySchedule]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Text style={styles.subGreeting}>Here's your business overview</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/calendar')}
              style={styles.searchBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={styles.searchBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <QuickActionGrid actions={QUICK_ACTIONS} />

        {/* Template quick-add */}
        <TemplateQuickAddRow />

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

        {/* Pending expense approvals banner */}
        {canApprove && pendingExpenseCount > 0 && (
          <TouchableOpacity
            style={[styles.reviewBanner, { borderColor: colors.warning + '40' }]}
            onPress={() => router.push('/(tabs)/expenses')}
            activeOpacity={0.7}
          >
            <View style={styles.reviewBannerLeft}>
              <Ionicons name="wallet" size={20} color={colors.warning} />
              <Text style={styles.reviewBannerText}>
                {pendingExpenseCount} expense{pendingExpenseCount !== 1 ? 's' : ''} pending approval
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Sync status */}
        <SyncStatusCard />

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

        {/* Weekly spending comparison */}
        <WeeklySpendingCard />

        {/* Unpaid invoices */}
        <UnpaidInvoicesCard />

        {/* Today's Schedule */}
        {todaySchedule && todaySchedule.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/crew-scheduling')}
            >
              <Card>
                {todaySchedule.map((group) => (
                  <View key={group.job.id} style={styles.scheduleRow}>
                    <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                    <Text style={styles.scheduleJobName} numberOfLines={1}>
                      {group.job.name}
                    </Text>
                    <Text style={styles.scheduleCrewCount}>
                      {group.assignments.length} crew
                    </Text>
                  </View>
                ))}
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* Spending chart */}
        {analyticsSummary && analyticsSummary.monthlySpending.length > 0 && (
          <View style={styles.chartContainer}>
            <MonthlySpendingChart data={analyticsSummary.monthlySpending} />
          </View>
        )}

        {/* Category breakdown */}
        {analyticsSummary && analyticsSummary.categoryBreakdown.length > 0 && (
          <View style={styles.chartContainer}>
            <CategoryBreakdownChart data={analyticsSummary.categoryBreakdown} />
          </View>
        )}

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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greetingText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    fontSize: 15,
    color: colors.textMuted,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scheduleJobName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  scheduleCrewCount: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  chartContainer: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
