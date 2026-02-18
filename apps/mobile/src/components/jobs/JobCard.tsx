import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card, ProgressBar } from '../ui';
import { useBudget } from '../../hooks/useBudget';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, createTypography } from '../../theme';
import type { Job } from '@jobreceipt/shared';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const { spent, budget, ratio, color } = useBudget(job.id);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/job/${job.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={job.status === 'ARCHIVED' ? styles.archived : undefined}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <Text style={[styles.name, typography.h3]} numberOfLines={1}>
              {job.name}
            </Text>
            {job.customerName && (
              <Text style={[styles.customer, typography.bodySmall]} numberOfLines={1}>
                {job.customerName}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, job.status === 'ACTIVE' ? styles.statusActive : job.status === 'ARCHIVED' ? styles.statusArchived : styles.statusCompleted]}>
            <Text style={styles.statusText}>{job.status}</Text>
          </View>
        </View>

        {budget > 0 && (
          <View style={styles.budgetSection}>
            <ProgressBar spent={spent} budget={budget} />
            <View style={styles.budgetRow}>
              <View style={styles.spentRow}>
                {ratio >= 0.8 && (
                  <Ionicons name="alert-circle" size={14} color={color} />
                )}
                <Text style={[styles.spent, { color }]}>
                  {formatMoney(spent)}
                </Text>
              </View>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  name: {},
  customer: {
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  archived: {
    opacity: 0.6,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusArchived: {
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
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  spentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
