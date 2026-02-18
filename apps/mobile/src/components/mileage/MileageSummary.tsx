import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, MoneyText } from '../ui';
import { formatMiles } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, createTypography } from '../../theme';

interface MileageSummaryProps {
  totalMiles: number;
  totalDeductionCents: number;
  period: string;
}

export function MileageSummary({
  totalMiles,
  totalDeductionCents,
  period,
}: MileageSummaryProps) {
  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <Text style={styles.period}>{period}</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.value}>{formatMiles(totalMiles)}</Text>
          <Text style={styles.label}>Total Miles</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <MoneyText cents={totalDeductionCents} size="large" color={colors.success} />
          <Text style={styles.label}>Tax Deduction</Text>
        </View>
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => {
  const typography = createTypography(colors);
  return StyleSheet.create({
    card: {
      marginBottom: spacing.lg,
    },
    period: {
      ...typography.label,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    value: {
      ...typography.moneyLarge,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
  });
};
