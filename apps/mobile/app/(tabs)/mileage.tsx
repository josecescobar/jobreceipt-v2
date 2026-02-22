import React, { useMemo, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { FilterChip, FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { MileageSummary, MileageTripCard } from '../../src/components/mileage';
import { useMileageTrips, useMileageSummary } from '../../src/hooks/useMileage';
import { spacing } from '../../src/theme';
import type { MileageQueryParams } from '../../src/api/mileage';

const DATE_FILTERS = ['ALL', 'WEEK', 'MONTH'] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

const FILTER_LABELS: Record<DateFilter, string> = {
  ALL: 'All Time',
  WEEK: 'This Week',
  MONTH: 'This Month',
};

function getDateRange(filter: DateFilter): { startDate?: string; endDate?: string } {
  if (filter === 'ALL') return {};
  const now = new Date();
  if (filter === 'MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start.toISOString() };
  }
  // WEEK
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return { startDate: start.toISOString() };
}

function getPeriodLabel(filter: DateFilter): string {
  if (filter === 'ALL') return 'All Time';
  const now = new Date();
  if (filter === 'MONTH') {
    return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  return 'This Week';
}

export default function MileageScreen() {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<DateFilter>('MONTH');

  const dateRange = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  const queryParams: MileageQueryParams = useMemo(
    () => ({ ...dateRange }),
    [dateRange],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useMileageTrips(queryParams);

  const { data: summary } = useMileageSummary(dateRange);

  const trips = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <FlatList
        data={trips}
        renderItem={({ item }) => (
          <MileageTripCard
            date={typeof item.date === 'string' ? item.date : new Date(item.date).toISOString()}
            miles={item.distanceMiles}
            deductionCents={item.totalDeduction}
            jobName={item.job?.name}
            onPress={() => router.push(`/mileage/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            <MileageSummary
              totalMiles={summary?.totalMiles ?? 0}
              totalDeductionCents={summary?.totalDeduction ?? 0}
              period={getPeriodLabel(dateFilter)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {DATE_FILTERS.map((filter) => (
                <FilterChip
                  key={filter}
                  label={FILTER_LABELS[filter]}
                  active={dateFilter === filter}
                  onPress={() => setDateFilter(filter)}
                />
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Trips Yet"
            message="Log your first mileage trip to start tracking deductions."
            actionLabel="Add Trip"
            onAction={() => router.push('/mileage/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/mileage/create')}
        icon="add"
        label="Add Trip"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    paddingVertical: spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
});
