import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/layout';
import { useAgingSummary, useSendReminder } from '../../src/hooks/useInvoiceAging';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { AgingBucket, AgingInvoice } from '@jobreceipt/shared';

export default function InvoiceAgingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: agingSummary, isLoading, refetch } = useAgingSummary();
  const sendReminder = useSendReminder();

  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const toggleBucket = useCallback((range: string) => {
    setExpandedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(range)) {
        next.delete(range);
      } else {
        next.add(range);
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSendReminder = useCallback(
    (invoiceId: string) => {
      sendReminder.mutate(invoiceId);
    },
    [sendReminder],
  );

  const renderInvoice = useCallback(
    (invoice: AgingInvoice) => (
      <TouchableOpacity
        key={invoice.id}
        style={styles.invoiceRow}
        onPress={() => router.push(`/invoice/${invoice.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.invoiceJob} numberOfLines={1}>
            {invoice.jobName}
          </Text>
          {invoice.customerName && (
            <Text style={styles.invoiceCustomer} numberOfLines={1}>
              {invoice.customerName}
            </Text>
          )}
        </View>
        <View style={styles.invoiceRight}>
          <Text style={styles.invoiceOutstanding}>
            {formatMoney(invoice.outstanding)}
          </Text>
          <View style={styles.daysOverdueBadge}>
            <Text style={styles.daysOverdueText}>
              {invoice.daysOverdue}d overdue
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.reminderBtn}
          onPress={() => handleSendReminder(invoice.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.warning} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [colors, styles, router, handleSendReminder],
  );

  const renderBucket = useCallback(
    (bucket: AgingBucket) => {
      const isExpanded = expandedBuckets.has(bucket.range);

      return (
        <View key={bucket.range} style={styles.bucketContainer}>
          <TouchableOpacity
            style={styles.bucketHeader}
            onPress={() => toggleBucket(bucket.range)}
            activeOpacity={0.7}
          >
            <View style={styles.bucketHeaderLeft}>
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={colors.textMuted}
              />
              <Text style={styles.bucketRange}>{bucket.range} days</Text>
            </View>
            <View style={styles.bucketHeaderRight}>
              <Text style={styles.bucketCount}>{bucket.count} invoice{bucket.count !== 1 ? 's' : ''}</Text>
              <Text style={styles.bucketTotal}>{formatMoney(bucket.totalOutstanding)}</Text>
            </View>
          </TouchableOpacity>
          {isExpanded && bucket.invoices.length > 0 && (
            <View style={styles.bucketInvoices}>
              {bucket.invoices.map(renderInvoice)}
            </View>
          )}
        </View>
      );
    },
    [expandedBuckets, colors, styles, toggleBucket, renderInvoice],
  );

  if (isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Invoice Aging' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const buckets = agingSummary?.buckets ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Invoice Aging' }} />
      <FlatList
        data={buckets}
        keyExtractor={(item) => item.range}
        renderItem={({ item }) => renderBucket(item)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderColor: colors.error + '40' }]}>
              <Text style={styles.summaryLabel}>Total Overdue</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {formatMoney(agingSummary?.totalOverdue ?? 0)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: colors.warning + '40' }]}>
              <Text style={styles.summaryLabel}>Overdue Count</Text>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                {agingSummary?.overdueCount ?? 0}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>No Overdue Invoices</Text>
            <Text style={styles.emptySubtitle}>All invoices are up to date</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingBottom: spacing.xxxl,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
      marginBottom: spacing.xs,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    bucketContainer: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    bucketHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    bucketHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bucketHeaderRight: {
      alignItems: 'flex-end',
    },
    bucketRange: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    bucketCount: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500',
    },
    bucketTotal: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.error,
      fontVariant: ['tabular-nums'],
    },
    bucketInvoices: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    invoiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    invoiceInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    invoiceNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    invoiceJob: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    invoiceCustomer: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 1,
    },
    invoiceRight: {
      alignItems: 'flex-end',
      marginRight: spacing.sm,
    },
    invoiceOutstanding: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.error,
      fontVariant: ['tabular-nums'],
    },
    daysOverdueBadge: {
      backgroundColor: colors.error + '20',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginTop: spacing.xs,
    },
    daysOverdueText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.error,
    },
    reminderBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.warning + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.md,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  });
