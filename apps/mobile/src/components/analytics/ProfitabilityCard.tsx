import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { ProfitabilityOverview } from '@jobreceipt/shared';

interface ProfitabilityCardProps {
  data: ProfitabilityOverview;
}

const MAX_VISIBLE_JOBS = 5;

export function ProfitabilityCard({ data }: ProfitabilityCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (data.jobs.length === 0) return null;

  const { totalRevenue, totalExpenses, totalProfit, avgMargin } = data.totals;
  const profitColor = totalProfit >= 0 ? colors.success : colors.error;
  const visibleJobs = data.jobs.slice(0, MAX_VISIBLE_JOBS);

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Job Profitability</Text>

      {/* Aggregate totals */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Revenue</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalExpenses)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Profit</Text>
          <Text style={[styles.summaryValue, { color: profitColor }]}>
            {formatMoney(totalProfit)}
          </Text>
        </View>
      </View>

      {/* Average margin */}
      {avgMargin !== null && (
        <Text style={styles.avgMargin}>
          Avg. Margin: {avgMargin.toFixed(1)}%
        </Text>
      )}

      {/* Per-job rows */}
      {visibleJobs.map((job) => {
        const jobProfitColor = job.netProfit >= 0 ? colors.success : colors.error;
        const hasContract = job.contractValue > 0;

        return (
          <TouchableOpacity
            key={job.jobId}
            style={styles.jobRow}
            activeOpacity={0.7}
            onPress={() => router.push(`/job/${job.jobId}`)}
          >
            <View style={styles.jobHeader}>
              <Text style={styles.jobName} numberOfLines={1}>{job.jobName}</Text>
              {job.profitMarginPercent !== null ? (
                <Text style={[styles.jobMargin, { color: jobProfitColor }]}>
                  {job.profitMarginPercent.toFixed(1)}%
                </Text>
              ) : (
                <Text style={styles.noContract}>No contract</Text>
              )}
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobMeta}>
                {hasContract ? formatMoney(job.contractValue) : '—'} rev
              </Text>
              <Text style={styles.jobMeta}>
                {formatMoney(job.totalExpenses)} cost
              </Text>
              <Text style={[styles.jobProfit, { color: jobProfitColor }]}>
                {formatMoney(job.netProfit)}
              </Text>
            </View>
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  avgMargin: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.md,
    textAlign: 'center',
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
  jobMargin: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noContract: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  jobProfit: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
