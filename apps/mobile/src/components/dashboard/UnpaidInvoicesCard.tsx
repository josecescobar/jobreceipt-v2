import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnpaidInvoiceSummary } from '../../hooks/useInvoices';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

export function UnpaidInvoicesCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { count, total, isLoading } = useUnpaidInvoiceSummary();

  if (isLoading || count === 0) return null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <Ionicons name="document-text-outline" size={22} color={colors.warning} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {count} Unpaid Invoice{count !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.amount}>{formatMoney(total)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning + '12',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.warning + '30',
    },
    iconWrap: {
      marginRight: spacing.md,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    amount: {
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
      marginTop: 1,
    },
  });
