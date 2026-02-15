import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRecentReceipts } from '../../hooks/useReceipts';
import { colors, spacing, borderRadius } from '../../theme';
import { getReceiptStatusColor } from '../../theme/colors';
import { formatMoney } from '../../lib/format';
import type { Receipt } from '@jobreceipt/shared';

const THUMB_SIZE = 64;

function ReceiptThumb({ receipt }: { receipt: Receipt }) {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/receipt/${receipt.id}`);
  };

  const statusColor = getReceiptStatusColor(receipt.status);

  return (
    <TouchableOpacity style={styles.thumb} onPress={handlePress} activeOpacity={0.7}>
      {receipt.thumbnailUrl ? (
        <Image
          source={{ uri: receipt.thumbnailUrl }}
          style={styles.thumbImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
          <Text style={styles.thumbPlaceholderText}>
            {receipt.merchantName?.[0] || '?'}
          </Text>
        </View>
      )}
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      {receipt.totalAmount != null && (
        <Text style={styles.amount} numberOfLines={1}>
          {formatMoney(receipt.totalAmount)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function RecentReceiptsStrip() {
  const { data } = useRecentReceipts();
  const receipts = data?.data ?? [];

  if (receipts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recent</Text>
      <FlatList
        data={receipts}
        renderItem={({ item }) => <ReceiptThumb receipt={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  thumb: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: borderRadius.md,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 4,
    right: 4,
    borderWidth: 1,
    borderColor: colors.black,
  },
  amount: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    marginTop: 2,
  },
});
