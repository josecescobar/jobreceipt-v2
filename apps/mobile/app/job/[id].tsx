import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Badge, Button, MoneyText } from '../../src/components/ui';
import {
  BudgetWarningBanner,
  BudgetBreakdownChart,
  CategoryBreakdownCard,
} from '../../src/components/jobs';
import { ActivityFeed } from '../../src/components/dashboard';
import type { ActivityItem } from '../../src/components/dashboard';
import { useJob, useUpdateJob } from '../../src/hooks/useJobs';
import { useBudget } from '../../src/hooks/useBudget';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useReceipts } from '../../src/hooks/useReceipts';
import { useMileageTrips } from '../../src/hooks/useMileage';
import { formatMoney, formatDate } from '../../src/lib/format';
import { exportJobReport, exportJobReportPdf } from '../../src/lib/export';
import { useTheme, type ThemeColors, createTypography, spacing } from '../../src/theme';

const getStatusColors = (colors: ThemeColors): Record<string, { bg: string; text: string }> => ({
  ACTIVE: { bg: colors.success + '20', text: colors.success },
  COMPLETED: { bg: colors.primary + '20', text: colors.primary },
  ARCHIVED: { bg: colors.textMuted + '20', text: colors.textMuted },
});

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const STATUS_COLORS = useMemo(() => getStatusColors(colors), [colors]);
  const { data: job, isLoading: jobLoading } = useJob(id!);
  const {
    spent,
    budget,
    ratio,
    remaining,
    color,
    categories,
  } = useBudget(id!);

  const updateJob = useUpdateJob();
  const [statusLoading, setStatusLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { data: expensesData } = useExpenses({ jobId: id });
  const expenses = useMemo(
    () => expensesData?.pages?.flatMap((p) => p.data) ?? [],
    [expensesData],
  );

  const { data: receiptsData } = useReceipts({ jobId: id });
  const receipts = useMemo(
    () => receiptsData?.pages?.flatMap((p) => p.data) ?? [],
    [receiptsData],
  );

  const { data: mileageData } = useMileageTrips({ jobId: id });
  const mileageTrips = useMemo(
    () => mileageData?.pages?.flatMap((p) => p.data) ?? [],
    [mileageData],
  );

  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    for (const e of expenses) {
      items.push({
        type: 'expense',
        id: e.id,
        date: e.date?.toString() ?? '',
        description: e.description,
        amount: e.amount,
      });
    }

    for (const r of receipts) {
      items.push({
        type: 'receipt',
        id: r.id,
        date: (r.transactionDate ?? r.createdAt)?.toString() ?? '',
        merchantName: r.merchantName,
        totalAmount: r.totalAmount,
        status: r.status,
      });
    }

    for (const m of mileageTrips) {
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
    return items;
  }, [expenses, receipts, mileageTrips]);

  if (jobLoading || !job) {
    return (
      <Screen padded={false}>
        <Header title="Job" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const statusStyle = STATUS_COLORS[job.status] || STATUS_COLORS.ACTIVE;
  const chartData = [
    { label: 'Materials', ...categories.materials },
    { label: 'Labor', ...categories.labor },
    { label: 'Equip', ...categories.equipment },
    { label: 'Sub', ...categories.subcontractor },
    { label: 'Overhead', ...categories.overhead },
  ];

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
    setStatusLoading(true);
    try {
      await updateJob.mutateAsync({ id: id!, updates: { status: newStatus } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Error handled silently, mutation will show stale data
    } finally {
      setStatusLoading(false);
    }
  };

  const handleMarkComplete = () => {
    Alert.alert(
      'Complete Job?',
      `${job.name}\n\n${expenses.length} expense${expenses.length !== 1 ? 's' : ''} · ${formatMoney(spent)} total\n${receipts.length} receipt${receipts.length !== 1 ? 's' : ''} · ${mileageTrips.length} trip${mileageTrips.length !== 1 ? 's' : ''}\n\nThis job will be marked as completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => handleStatusChange('COMPLETED') },
      ],
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Job?',
      `${job.name} will be archived and hidden from active views.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: () => handleStatusChange('ARCHIVED') },
      ],
    );
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportJobReportPdf(id!, job.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Something went wrong.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportJobReport(id!, job.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Something went wrong.');
    } finally {
      setExporting(false);
    }
  };

  const activeCategories = [
    { label: 'Materials', ...categories.materials },
    { label: 'Labor', ...categories.labor },
    { label: 'Equipment', ...categories.equipment },
    { label: 'Subcontractor', ...categories.subcontractor },
    { label: 'Overhead', ...categories.overhead },
  ].filter((c) => c.spent > 0 || c.budget > 0);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title={job.name}
        showBack
        rightAction={{ icon: 'create-outline', onPress: () => router.push(`/job/edit/${id}`) }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Job info */}
        <View style={styles.infoSection}>
          <Badge
            label={job.status}
            color={statusStyle.text}
            backgroundColor={statusStyle.bg}
          />
          {job.customerName && (
            <Text style={styles.customer}>{job.customerName}</Text>
          )}
          {job.customerAddress && (
            <Text style={styles.customerAddress}>{job.customerAddress}</Text>
          )}
          {(job.startDate || job.endDate) && (
            <Text style={styles.dates}>
              {job.startDate ? formatDate(job.startDate.toString()) : ''}
              {job.startDate && job.endDate ? ' — ' : ''}
              {job.endDate ? formatDate(job.endDate.toString()) : ''}
            </Text>
          )}
          {job.notes && (
            <Text style={styles.notes}>{job.notes}</Text>
          )}
        </View>

        {/* Status actions */}
        {job.status === 'ACTIVE' && (
          <View style={styles.statusActions}>
            <Button
              title="Mark Complete"
              onPress={handleMarkComplete}
              loading={statusLoading}
            />
          </View>
        )}
        {job.status === 'COMPLETED' && (
          <View style={styles.statusActions}>
            <Button
              title="Reactivate"
              onPress={() => handleStatusChange('ACTIVE')}
              variant="secondary"
              loading={statusLoading}
            />
            <Button
              title="Archive"
              onPress={handleArchive}
              variant="ghost"
              loading={statusLoading}
            />
          </View>
        )}
        {job.status === 'ARCHIVED' && (
          <View style={styles.statusActions}>
            <Button
              title="Reactivate"
              onPress={() => handleStatusChange('ACTIVE')}
              variant="secondary"
              loading={statusLoading}
            />
          </View>
        )}

        {/* Budget warning/alert */}
        {ratio >= 0.8 && budget > 0 && (
          <BudgetWarningBanner ratio={ratio} remaining={remaining} />
        )}

        {/* Total budget summary */}
        {budget > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Spent</Text>
                <MoneyText cents={spent} size="large" color={color} />
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryLabel}>Budget</Text>
                <MoneyText cents={budget} size="large" />
              </View>
            </View>
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>
                {remaining >= 0 ? 'Remaining' : 'Over by'}
              </Text>
              <Text style={[styles.remainingValue, { color }]}>
                {formatMoney(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        )}

        {/* Budget breakdown chart */}
        {budget > 0 && <BudgetBreakdownChart data={chartData} />}

        {/* Category cards (only non-zero) */}
        {activeCategories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {activeCategories.map((cat) => (
              <CategoryBreakdownCard
                key={cat.label}
                label={cat.label}
                spent={cat.spent}
                budget={cat.budget}
              />
            ))}
          </>
        )}

        {/* Activity timeline */}
        <Text style={styles.sectionTitle}>
          Activity ({expenses.length + receipts.length + mileageTrips.length})
        </Text>
        <ActivityFeed items={activityItems} />

        {/* Export report */}
        <View style={styles.exportSection}>
          <Button
            title={exportingPdf ? 'Generating PDF...' : 'Export PDF Report'}
            onPress={handleExportPdf}
            loading={exportingPdf}
          />
          <Button
            title={exporting ? 'Exporting...' : 'Export CSV Report'}
            onPress={handleExport}
            variant="secondary"
            loading={exporting}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: ReturnType<typeof createTypography>) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  customer: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.xs,
  },
  customerAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dates: {
    fontSize: 13,
    color: colors.textMuted,
  },
  notes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  statusActions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  remainingLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  exportSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
