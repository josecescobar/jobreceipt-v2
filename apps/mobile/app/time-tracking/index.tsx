import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Header } from '../../src/components/layout';
import { FilterChip, FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useTimeEntries, useTimeEntrySummary } from '../../src/hooks/useTimeTracking';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { TimeEntryQueryParams } from '../../src/api/time-tracking';

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
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return { startDate: start.toISOString() };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function TimeTrackingListScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('MONTH');

  const dateRange = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  const queryParams: TimeEntryQueryParams = useMemo(
    () => ({ ...dateRange, jobId }),
    [dateRange, jobId],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useTimeEntries(queryParams);

  const { data: summary } = useTimeEntrySummary({ ...dateRange, jobId });

  const entries = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Time Tracking" showBack />
      <FlatList
        data={entries}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/time-tracking/edit/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                {item.job && <Text style={styles.cardJob}>{item.job.name}</Text>}
                {item.description && (
                  <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                )}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardDuration}>{formatDuration(item.durationMinutes)}</Text>
                <Text style={styles.cardCost}>{formatMoney(item.totalCost)}</Text>
              </View>
            </View>
          </TouchableOpacity>
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
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Hours</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(summary?.totalMinutes ?? 0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Cost</Text>
                  <Text style={styles.summaryValue}>
                    {formatMoney(summary?.totalCost ?? 0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Entries</Text>
                  <Text style={styles.summaryValue}>
                    {summary?.totalEntries ?? 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Date Filters */}
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
            title="No Time Entries"
            message="Log your first time entry to start tracking labor costs."
            actionLabel="Log Time"
            onAction={() => router.push(jobId ? `/time-tracking/create?jobId=${jobId}` : '/time-tracking/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push(jobId ? `/time-tracking/create?jobId=${jobId}` : '/time-tracking/create')}
        icon="add"
        label="Log Time"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  filters: {
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cardJob: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardDuration: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  cardCost: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
