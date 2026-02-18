import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney, formatDate } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius, MIN_TOUCH_TARGET } from '../../theme';

interface DuplicateWarningBannerProps {
  duplicateOf: {
    id: string;
    merchantName: string | null;
    totalAmount: number | null;
    transactionDate: string | null;
    status: string;
  };
  onDismiss: () => void;
}

export function DuplicateWarningBanner({
  duplicateOf,
  onDismiss,
}: DuplicateWarningBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const details = [
    duplicateOf.merchantName,
    duplicateOf.totalAmount != null ? formatMoney(duplicateOf.totalAmount) : null,
    duplicateOf.transactionDate ? formatDate(duplicateOf.transactionDate) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Ionicons name="warning" size={18} color={colors.warning} />
          <Text style={styles.label}>Possible Duplicate</Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>
        This receipt looks similar to an existing one.
      </Text>
      {details ? <Text style={styles.details}>{details}</Text> : null}
      <TouchableOpacity
        style={styles.viewLink}
        onPress={() => router.push(`/receipt/${duplicateOf.id}`)}
      >
        <Text style={styles.viewLinkText}>View Original</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.warning + '10',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.warning,
      marginBottom: spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.warning,
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dismissBtn: {
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
    },
    description: {
      fontSize: 14,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    details: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    viewLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    viewLinkText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
