import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/layout';
import { FilterChip, EmptyState, Input, DatePickerField, LoadingScreen } from '../../src/components/ui';
import { ReceiptCard } from '../../src/components/receipt';
import { useReceipts } from '../../src/hooks/useReceipts';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_FILTERS = ['ALL', 'PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'All',
  PROCESSING: 'Processing',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function ReceiptsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFrom, setShowDateFrom] = useState(false);
  const [showDateTo, setShowDateTo] = useState(false);

  const hasDateFilter = dateFrom || dateTo;

  const queryParams = useMemo(
    () => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      merchantName: search || undefined,
      startDate: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
      endDate: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
    }),
    [statusFilter, search, dateFrom, dateTo],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useReceipts(queryParams);

  const receipts = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search by merchant..."
        style={styles.searchInput}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={FILTER_LABELS[filter]}
            active={statusFilter === filter}
            onPress={() => setStatusFilter(filter)}
          />
        ))}
      </ScrollView>

      {/* Date range filter */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[styles.datePill, dateFrom ? styles.datePillActive : null]}
          onPress={() => setShowDateFrom(!showDateFrom)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color={dateFrom ? colors.primary : colors.textMuted} />
          <Text style={[styles.datePillText, dateFrom && styles.datePillTextActive]}>
            {dateFrom || 'From'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.dateDash}>-</Text>

        <TouchableOpacity
          style={[styles.datePill, dateTo ? styles.datePillActive : null]}
          onPress={() => setShowDateTo(!showDateTo)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={14} color={dateTo ? colors.primary : colors.textMuted} />
          <Text style={[styles.datePillText, dateTo && styles.datePillTextActive]}>
            {dateTo || 'To'}
          </Text>
        </TouchableOpacity>

        {hasDateFilter && (
          <TouchableOpacity
            style={styles.clearDateBtn}
            onPress={() => { setDateFrom(''); setDateTo(''); setShowDateFrom(false); setShowDateTo(false); }}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showDateFrom && (
        <DatePickerField
          label="From date"
          value={dateFrom}
          onChange={(d) => { setDateFrom(d); setShowDateFrom(false); }}
          placeholder="Start date"
        />
      )}

      {showDateTo && (
        <DatePickerField
          label="To date"
          value={dateTo}
          onChange={(d) => { setDateTo(d); setShowDateTo(false); }}
          placeholder="End date"
        />
      )}

      <FlatList
        data={receipts}
        renderItem={({ item }) => (
          <ReceiptCard
            receipt={item}
            onPress={() => router.push(`/receipt/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Receipts"
            message={
              statusFilter === 'ALL'
                ? 'Scan your first receipt from the Capture tab.'
                : `No ${FILTER_LABELS[statusFilter].toLowerCase()} receipts found.`
            }
          />
        }
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  searchInput: {
    marginBottom: 0,
  },
  filters: {
    paddingVertical: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePillActive: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.primary + '15',
  },
  datePillText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  datePillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateDash: {
    fontSize: 14,
    color: colors.textMuted,
  },
  clearDateBtn: {
    marginLeft: spacing.xs,
    padding: 4,
  },
  list: {
    paddingBottom: 100,
  },
});
