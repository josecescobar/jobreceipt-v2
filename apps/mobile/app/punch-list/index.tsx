import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import {
  usePunchListItems,
  useJobPunchListSummary,
} from '../../src/hooks/usePunchLists';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#9CA3AF',
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function PunchListScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: summary } = useJobPunchListSummary(jobId!);
  const { data: listData, isLoading, refetch, isRefetching } = usePunchListItems(
    jobId!,
    { status: statusFilter },
  );

  const items = listData?.data ?? [];

  if (isLoading) return <LoadingScreen />;

  const completionPercent = summary?.completionPercent ?? 0;
  const completedCount = summary?.completed ?? 0;
  const totalCount = summary?.total ?? 0;

  return (
    <Screen padded={false}>
      <Header title="Punch List" showBack />

      <FlatList
        data={items}
        ListHeaderComponent={
          <View>
            {/* Summary Card */}
            {totalCount > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>
                    {completedCount} of {totalCount} complete
                  </Text>
                  <Text style={styles.summaryPercent}>{completionPercent}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${completionPercent}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Filter Chips */}
            <View style={styles.filterRow}>
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.label}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setStatusFilter(f.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const priorityColor = PRIORITY_COLORS[item.priority] || '#9CA3AF';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/punch-list/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.cardMeta}>
                    {item.assignedTo?.name && (
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="person-outline"
                          size={12}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {item.assignedTo.name}
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaItem}>
                      <Text style={styles.priorityLabel}>
                        {PRIORITY_LABELS[item.priority]}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === 'COMPLETED'
                          ? colors.success + '20'
                          : item.status === 'IN_PROGRESS'
                          ? colors.warning + '20'
                          : colors.textMuted + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === 'COMPLETED'
                            ? colors.success
                            : item.status === 'IN_PROGRESS'
                            ? colors.warning
                            : colors.textMuted,
                      },
                    ]}
                  >
                    {STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Punch List Items"
            message="Add items to track work that needs to be completed or corrected."
            actionLabel="Add Item"
            onAction={() => router.push(`/punch-list/create?jobId=${jobId}`)}
          />
        }
      />

      <FAB
        onPress={() => router.push(`/punch-list/create?jobId=${jobId}`)}
        icon="add"
        label="Add Item"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    summaryPercent: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.success,
      borderRadius: borderRadius.full,
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.white,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    priorityDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.md,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    priorityLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      marginLeft: spacing.sm,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
    },
  });
