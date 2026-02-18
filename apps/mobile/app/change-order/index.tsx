import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { useAllChangeOrders } from '../../src/hooks/useChangeOrders';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_FILTERS = ['All', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function getStatusStyle(status: string, colors: ThemeColors) {
  if (status === 'APPROVED') return { bg: colors.success + '20', text: colors.success };
  if (status === 'SUBMITTED') return { bg: colors.primary + '20', text: colors.primary };
  if (status === 'REJECTED') return { bg: colors.error + '20', text: colors.error };
  return { bg: colors.textMuted + '20', text: colors.textMuted };
}

function getChipStyle(filter: StatusFilter, colors: ThemeColors) {
  if (filter === 'APPROVED') return { bg: colors.success, text: '#FFFFFF' };
  if (filter === 'SUBMITTED') return { bg: colors.primary, text: '#FFFFFF' };
  if (filter === 'REJECTED') return { bg: colors.error, text: '#FFFFFF' };
  if (filter === 'DRAFT') return { bg: colors.textMuted, text: '#FFFFFF' };
  return { bg: colors.primary, text: '#FFFFFF' };
}

const STATUS_LABELS: Record<string, string> = {
  All: 'All',
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function ChangeOrderListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');

  const queryParams = activeFilter === 'All' ? {} : { status: activeFilter };
  const { data, isLoading, refetch } = useAllChangeOrders(queryParams);
  const changeOrders = data?.data ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const statusStyle = getStatusStyle(item.status, colors);
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push(`/change-order/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={styles.rowHeader}>
              <Text style={styles.coNumber}>{item.changeOrderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.coTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.job && (
              <Text style={styles.jobName} numberOfLines={1}>
                {item.job.name}
              </Text>
            )}
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.rowRight}>
            <Text
              style={[
                styles.amount,
                item.total < 0 && { color: colors.error },
              ]}
            >
              {formatMoney(item.total)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No change orders yet</Text>
        <Text style={styles.emptyDesc}>
          Create a change order from a job to track scope changes and budget adjustments.
        </Text>
      </View>
    );
  }, [isLoading, colors, styles]);

  return (
    <Screen padded={false}>
      <Header title="Change Orders" showBack />

      {/* Status filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            const chipColors = getChipStyle(filter, colors);
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: chipColors.bg, borderColor: chipColors.bg },
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && { color: chipColors.text },
                  ]}
                >
                  {STATUS_LABELS[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={changeOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/change-order/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    filterContainer: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterScroll: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl + 60,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowLeft: {
      flex: 1,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 4,
    },
    coNumber: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    coTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    jobName: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    date: {
      fontSize: 12,
      color: colors.textMuted,
    },
    rowRight: {
      alignItems: 'flex-end',
      gap: spacing.xs,
      marginLeft: spacing.sm,
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xxxl,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
  });
