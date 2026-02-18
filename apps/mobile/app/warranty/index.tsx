import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import {
  useWarrantyList,
  useWarrantySummary,
} from '../../src/hooks/useWarranties';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import { formatDate } from '../../src/lib/format';
import type { Warranty } from '@jobreceipt/shared';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'EXPIRING_SOON', label: 'Expiring Soon' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'CLAIMED', label: 'Claimed' },
] as const;

const getStatusBadgeStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'ACTIVE':
      return { bg: colors.success + '20', text: colors.success, label: 'Active' };
    case 'EXPIRING_SOON':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Expiring Soon' };
    case 'EXPIRED':
      return { bg: colors.error + '20', text: colors.error, label: 'Expired' };
    case 'CLAIMED':
      return { bg: colors.primary + '20', text: colors.primary, label: 'Claimed' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

export default function WarrantyListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: summary } = useWarrantySummary();
  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching,
  } = useWarrantyList({ status: statusFilter });

  const items = listData?.data ?? [];

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Warranties" showBack />

      <FlatList
        data={items}
        ListHeaderComponent={
          <View>
            {/* Summary Card */}
            {summary && summary.total > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.success }]}>
                      {summary.active}
                    </Text>
                    <Text style={styles.summaryLabel}>Active</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.warning }]}>
                      {summary.expiringSoon}
                    </Text>
                    <Text style={styles.summaryLabel}>Expiring</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.error }]}>
                      {summary.expired}
                    </Text>
                    <Text style={styles.summaryLabel}>Expired</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.primary }]}>
                      {summary.claimed}
                    </Text>
                    <Text style={styles.summaryLabel}>Claimed</Text>
                  </View>
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
        renderItem={({ item }: { item: Warranty }) => {
          const statusStyle = getStatusBadgeStyle(item.status, colors);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/warranty/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.cardMeta}>
                    {item.job?.name && (
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="briefcase-outline"
                          size={11}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {item.job.name}
                        </Text>
                      </View>
                    )}
                    {item.manufacturer && (
                      <Text style={styles.metaText}>{item.manufacturer}</Text>
                    )}
                  </View>
                  <Text style={styles.dateText}>
                    Expires {formatDate(item.endDate)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {statusStyle.label}
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
            title="No Warranties"
            message="Track warranties for materials and equipment used on your jobs."
            actionLabel="Add Warranty"
            onAction={() => router.push('/warranty/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/warranty/create')}
        icon="add"
        label="Add Warranty"
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
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryCount: {
      fontSize: 22,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
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
    dateText: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
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
