import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui';
import { formatMiles, formatMoney, formatDate } from '../../lib/format';
import { colors, spacing } from '../../theme';

interface MileageTripCardProps {
  date: string;
  miles: number;
  deductionCents: number;
  jobName?: string;
  startLocation?: string;
  endLocation?: string;
}

export function MileageTripCard({
  date,
  miles,
  deductionCents,
  jobName,
  startLocation,
  endLocation,
}: MileageTripCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="navigate" size={20} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.date}>{formatDate(date)}</Text>
          {(startLocation || endLocation) && (
            <Text style={styles.route} numberOfLines={1}>
              {startLocation || '?'} → {endLocation || '?'}
            </Text>
          )}
          {jobName && <Text style={styles.job}>{jobName}</Text>}
        </View>
        <View style={styles.right}>
          <Text style={styles.miles}>{formatMiles(miles)}</Text>
          <Text style={styles.deduction}>{formatMoney(deductionCents)}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  route: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  job: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  miles: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deduction: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
});
