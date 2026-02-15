import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, ProgressBar } from '../ui';
import { useBudget } from '../../hooks/useBudget';
import { formatMoney } from '../../lib/format';
import { colors, spacing, typography } from '../../theme';
import type { Job } from '@jobreceipt/shared';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const { spent, budget, ratio, color } = useBudget(job.id);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/job/${job.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <Text style={styles.name} numberOfLines={1}>
              {job.name}
            </Text>
            {job.customerName && (
              <Text style={styles.customer} numberOfLines={1}>
                {job.customerName}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, job.status === 'ACTIVE' ? styles.statusActive : styles.statusCompleted]}>
            <Text style={styles.statusText}>{job.status}</Text>
          </View>
        </View>

        {budget > 0 && (
          <View style={styles.budgetSection}>
            <ProgressBar spent={spent} budget={budget} />
            <View style={styles.budgetRow}>
              <Text style={[styles.spent, { color }]}>
                {formatMoney(spent)}
              </Text>
              <Text style={styles.budgetTotal}>
                of {formatMoney(budget)}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.h3,
  },
  customer: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  budgetSection: {
    marginTop: spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  spent: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  budgetTotal: {
    fontSize: 14,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
