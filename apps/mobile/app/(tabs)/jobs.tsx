import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { FilterChip, FAB, EmptyState, Input, LoadingScreen } from '../../src/components/ui';
import { JobCard } from '../../src/components/jobs';
import { useJobs } from '../../src/hooks/useJobs';
import { useUIStore } from '../../src/stores/ui.store';
import { spacing, typography } from '../../src/theme';
import type { Job } from '@jobreceipt/shared';

const FILTERS = ['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ALL'] as const;

export default function JobsScreen() {
  const router = useRouter();
  const jobStatusFilter = useUIStore((s) => s.jobStatusFilter);
  const setJobStatusFilter = useUIStore((s) => s.setJobStatusFilter);
  const [search, setSearch] = React.useState('');

  const queryParams = useMemo(
    () => ({
      status: jobStatusFilter === 'ALL' ? undefined : jobStatusFilter,
      search: search || undefined,
    }),
    [jobStatusFilter, search],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useJobs(queryParams);

  const jobs = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      {/* Search */}
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search jobs..."
        style={styles.searchInput}
      />

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            active={jobStatusFilter === filter}
            onPress={() => setJobStatusFilter(filter)}
          />
        ))}
      </View>

      {/* Job list */}
      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobCard job={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Jobs Yet"
            message="Create your first job to start tracking expenses."
            actionLabel="Add Job"
            onAction={() => router.push('/job/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/job/create')}
        icon="add"
        label="Add Job"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    marginBottom: 0,
  },
  filters: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  list: {
    paddingBottom: 100,
  },
});
