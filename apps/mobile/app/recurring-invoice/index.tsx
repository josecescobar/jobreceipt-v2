import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FilterChip, FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useRecurringInvoices } from '../../src/hooks/useRecurringInvoices';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'true', label: 'Active' },
  { key: 'false', label: 'Paused' },
] as const;

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
};

function formatReadableDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function computeInvoiceTotal(lineItems: Array<{ unitPrice: number; quantity: number }>): number {
  return lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export default function RecurringInvoicesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>(undefined);

  const params = useMemo(
    () => (isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
    [isActiveFilter],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useRecurringInvoices(params);

  const items = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const total = computeInvoiceTotal(item.lineItems ?? []);
      const frequencyLabel = FREQUENCY_LABELS[item.frequency] ?? item.frequency;
      const isActive = item.isActive;

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push(`/recurring-invoice/${item.id}`)}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <View style={styles.jobRow}>
                <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotPaused]} />
                <Text style={styles.jobName} numberOfLines={1}>
                  {item.job?.name ?? 'Unknown Job'}
                </Text>
              </View>
              <Text style={styles.nextDate}>
                Next: {item.nextOccurrence ? formatReadableDate(item.nextOccurrence) : 'N/A'}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.amount}>{formatMoney(total)}</Text>
              <View style={[styles.frequencyBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.frequencyText, { color: colors.primary }]}>
                  {frequencyLabel}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Recurring Invoices" showBack />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter.label}
            label={filter.label}
            active={isActiveFilter === filter.key}
            onPress={() => setIsActiveFilter(filter.key)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Recurring Invoices"
            message="Set up automatic billing for repeat work."
            actionLabel="Create Recurring Invoice"
            onAction={() => router.push('/recurring-invoice/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/recurring-invoice/create')}
        icon="add"
        label="New Recurring"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    filterScroll: {
      flexGrow: 0,
    },
    filterRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    jobRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.sm,
    },
    dotActive: {
      backgroundColor: colors.success,
    },
    dotPaused: {
      backgroundColor: colors.textMuted,
    },
    jobName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    nextDate: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      marginLeft: 8 + spacing.sm,
    },
    cardRight: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      marginBottom: 4,
    },
    frequencyBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    frequencyText: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
