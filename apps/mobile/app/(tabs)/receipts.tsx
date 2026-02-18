import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/layout';
import { FilterChip, EmptyState, Input, DatePickerField, LoadingScreen } from '../../src/components/ui';
import { ReceiptCard } from '../../src/components/receipt';
import { useReceipts } from '../../src/hooks/useReceipts';
import { useJobs } from '../../src/hooks/useJobs';
import { useTheme, type ThemeColors, spacing, borderRadius, getReceiptStatusColor } from '../../src/theme';
import { formatMoney } from '../../src/lib/format';
import type { Receipt } from '@jobreceipt/shared';

const STATUS_FILTERS = ['ALL', 'PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'All',
  PROCESSING: 'Processing',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

type ViewMode = 'list' | 'grid';

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;

export default function ReceiptsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth } = useWindowDimensions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFrom, setShowDateFrom] = useState(false);
  const [showDateTo, setShowDateTo] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const hasDateFilter = dateFrom || dateTo;

  // Fetch active jobs for the job filter
  const { data: jobsData } = useJobs({ status: 'ACTIVE' });
  const activeJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const queryParams = useMemo(
    () => ({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      merchantName: search || undefined,
      startDate: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
      endDate: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
      jobId: selectedJobId ?? undefined,
      includeThumbnails: viewMode === 'grid' ? true : undefined,
    }),
    [statusFilter, search, dateFrom, dateTo, selectedJobId, viewMode],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useReceipts(queryParams);

  const receipts = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  // Grid cell dimensions
  const horizontalPadding = spacing.lg * 2; // Screen horizontal padding
  const totalGapWidth = GRID_GAP * (GRID_COLUMNS - 1);
  const cellWidth = (screenWidth - horizontalPadding - totalGapWidth) / GRID_COLUMNS;
  const cellHeight = cellWidth * 1.3;

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
  }, []);

  const renderGridItem = useCallback(({ item }: { item: Receipt }) => {
    const statusColor = getReceiptStatusColor(item.status, colors);
    return (
      <TouchableOpacity
        style={[styles.gridCell, { width: cellWidth, height: cellHeight }]}
        onPress={() => router.push(`/receipt/${item.id}`)}
        activeOpacity={0.7}
      >
        {item.imageDownloadUrl ? (
          <Image
            source={{ uri: item.imageDownloadUrl }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        {/* Status dot */}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

        {/* Amount overlay */}
        {item.totalAmount != null && (
          <View style={styles.amountOverlay}>
            <Text style={styles.amountOverlayText} numberOfLines={1}>
              {formatMoney(item.totalAmount)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [colors, cellWidth, cellHeight, styles, router]);

  const renderListItem = useCallback(({ item }: { item: Receipt }) => (
    <ReceiptCard
      receipt={item}
      onPress={() => router.push(`/receipt/${item.id}`)}
    />
  ), [router]);

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search by merchant..."
          style={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={toggleViewMode}
          activeOpacity={0.7}
        >
          <Ionicons
            name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

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

      {/* Job filter chips */}
      {activeJobs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jobFilters}
        >
          <TouchableOpacity
            style={[
              styles.jobChip,
              selectedJobId === null && styles.jobChipActive,
            ]}
            onPress={() => setSelectedJobId(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.jobChipText,
                selectedJobId === null && styles.jobChipTextActive,
              ]}
            >
              All Jobs
            </Text>
          </TouchableOpacity>
          {activeJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[
                styles.jobChip,
                selectedJobId === job.id && styles.jobChipActive,
              ]}
              onPress={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.jobChipText,
                  selectedJobId === job.id && styles.jobChipTextActive,
                ]}
                numberOfLines={1}
              >
                {job.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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

      {viewMode === 'list' ? (
        <FlatList
          key="list"
          data={receipts}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
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
      ) : (
        <FlatList
          key="grid"
          data={receipts}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridList}
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
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    paddingVertical: spacing.md,
  },
  jobFilters: {
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  jobChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jobChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    maxWidth: 120,
  },
  jobChipTextActive: {
    color: colors.white,
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
  gridList: {
    paddingBottom: 100,
    gap: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridCell: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  statusDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  amountOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  amountOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
