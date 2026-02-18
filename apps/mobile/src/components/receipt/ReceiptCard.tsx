import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card } from '../ui';
import { ReceiptStatusBadge } from './ReceiptStatusBadge';
import { formatMoney, formatDate } from '../../lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius } from '../../theme';

interface ReceiptCardProps {
  receipt: {
    id: string;
    merchantName?: string | null;
    totalAmount?: number | null;
    transactionDate?: string | Date | null;
    createdAt: string | Date;
    status: string;
    imageUrl?: string | null;
  };
  onPress: () => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const merchantName = receipt.merchantName || 'Unknown Merchant';
  const rawDate = receipt.transactionDate || receipt.createdAt;
  const displayDate = rawDate instanceof Date ? rawDate.toISOString() : String(rawDate);
  const initial = merchantName.charAt(0).toUpperCase();

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.row}>
          {receipt.imageUrl ? (
            <Image source={{ uri: receipt.imageUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{initial}</Text>
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.merchant} numberOfLines={1}>
                {merchantName}
              </Text>
              <ReceiptStatusBadge status={receipt.status} />
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.date}>{formatDate(displayDate)}</Text>
              {receipt.totalAmount != null && (
                <Text style={styles.amount}>{formatMoney(receipt.totalAmount)}</Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  merchant: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
