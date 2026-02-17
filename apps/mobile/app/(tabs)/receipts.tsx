import React, { useMemo, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { FilterChip, EmptyState, Input, LoadingScreen } from '../../src/components/ui';
import { ReceiptCard } from '../../src/components/receipt';
import { useReceipts } from '../../src/hooks/useReceipts';
import { spacing } from '../../src/theme';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');

  const queryParams = useMemo(
    () => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      merchantName: search || undefined,
    }),
    [statusFilter, search],
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

const styles = StyleSheet.create({
  searchInput: {
    marginBottom: 0,
  },
  filters: {
    paddingVertical: spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
});
