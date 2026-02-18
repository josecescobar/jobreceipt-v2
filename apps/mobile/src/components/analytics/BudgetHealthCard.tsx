import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui';
import { formatMoney } from '../../lib/format';
import { getBudgetColor } from '../../theme/colors';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { BudgetHealthOverview } from '@jobreceipt/shared';

interface BudgetHealthCardProps {
  data: BudgetHealthOverview;
}

const MAX_VISIBLE_JOBS = 5;

export function BudgetHealthCard({ data }: BudgetHealthCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (data.jobs.length === 0) return null;

  const overallRatio = data.totalBudget > 0 ? data.totalSpent / data.totalBudget : 0;
  const overallPercent = Math.min(Math.round(overallRatio * 100), 100);
  const overallColor = getBudgetColor(data.totalSpent, data.totalBudget, colors);
  const visibleJobs = data.jobs.slice(0, MAX_VISIBLE_JOBS);

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Budget Health</Text>

      {/* Aggregate summary */}
      <Text style={styles.summaryText}>
        {formatMoney(data.totalSpent)}
        <Text style={styles.summaryMuted}> of {formatMoney(data.totalBudget)}</Text>
      </Text>

      {/* Overall progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${overallPercent}%`, backgroundColor: overallColor },
          ]}
        />
      </View>

      {/* Status dots */}
      <View style={styles.statusRow}>
        {data.healthyCount > 0 && (
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>{data.healthyCount} On Track</Text>
          </View>
        )}
        {data.warningCount > 0 && (
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.statusText}>{data.warningCount} Warning</Text>
          </View>
        )}
        {data.overBudgetCount > 0 && (
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
            <Text style={styles.statusText}>{data.overBudgetCount} Over</Text>
          </View>
        )}
      </View>

      {/* Per-job rows */}
      {visibleJobs.map((job) => {
        const jobColor = getBudgetColor(job.totalSpent, job.budgetTotal, colors);
        const jobPercent = Math.min(Math.round(job.utilizationRatio * 100), 100);

        return (
          <TouchableOpacity
            key={job.jobId}
            style={styles.jobRow}
            activeOpacity={0.7}
            onPress={() => router.push(`/job/${job.jobId}`)}
          >
            <View style={styles.jobHeader}>
              <Text style={styles.jobName} numberOfLines={1}>{job.jobName}</Text>
              <Text style={[styles.jobPercent, { color: jobColor }]}>
                {Math.round(job.utilizationRatio * 100)}%
              </Text>
            </View>
            <View style={styles.jobProgressBar}>
              <View
                style={[
                  styles.jobProgressFill,
                  { width: `${jobPercent}%`, backgroundColor: jobColor },
                ]}
              />
            </View>
            <Text style={styles.jobMeta}>
              {formatMoney(job.totalSpent)} / {formatMoney(job.budgetTotal)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  summaryMuted: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  jobRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  jobPercent: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  jobProgressBar: {
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  jobProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  jobMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
