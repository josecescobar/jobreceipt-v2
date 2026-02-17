import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui';
import { formatMoney } from '../../lib/format';
import { colors, spacing, borderRadius } from '../../theme';
import type { TopJob } from '@jobreceipt/shared';

interface TopJobsListProps {
  data: TopJob[];
}

export function TopJobsList({ data }: TopJobsListProps) {
  const router = useRouter();

  if (data.length === 0) return null;

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Top Jobs by Spending</Text>
      {data.map((job, index) => (
        <TouchableOpacity
          key={job.jobId}
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => router.push(`/job/${job.jobId}`)}
        >
          <View style={styles.rank}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.jobName} numberOfLines={1}>
              {job.jobName}
            </Text>
            <Text style={styles.meta}>
              {job.expenseCount} expense{job.expenseCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.amount}>{formatMoney(job.totalSpent)}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  jobName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
