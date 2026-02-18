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
  useEquipmentList,
  useEquipmentSummary,
} from '../../src/hooks/useEquipment';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { Equipment } from '@jobreceipt/shared';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'IN_USE', label: 'In Use' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'RETIRED', label: 'Retired' },
] as const;

const getStatusBadgeStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'AVAILABLE':
      return { bg: colors.success + '20', text: colors.success, label: 'Available' };
    case 'IN_USE':
      return { bg: colors.primary + '20', text: colors.primary, label: 'In Use' };
    case 'MAINTENANCE':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Maintenance' };
    case 'RETIRED':
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: 'Retired' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

export default function EquipmentListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: summary } = useEquipmentSummary();
  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching,
  } = useEquipmentList({ status: statusFilter });

  const items = listData?.data ?? [];

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Equipment" showBack />

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
                      {summary.available}
                    </Text>
                    <Text style={styles.summaryLabel}>Available</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.primary }]}>
                      {summary.inUse}
                    </Text>
                    <Text style={styles.summaryLabel}>In Use</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.warning }]}>
                      {summary.maintenance}
                    </Text>
                    <Text style={styles.summaryLabel}>Maintenance</Text>
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
        renderItem={({ item }) => {
          const statusStyle = getStatusBadgeStyle(item.status, colors);
          const currentAssignment = (item as any).currentAssignment;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/equipment/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="construct-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.cardMeta}>
                    {item.type && (
                      <Text style={styles.metaText}>{item.type}</Text>
                    )}
                    {currentAssignment?.job?.name && (
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="briefcase-outline"
                          size={11}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {currentAssignment.job.name}
                        </Text>
                      </View>
                    )}
                  </View>
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
            title="No Equipment"
            message="Add tools and equipment to track assignments and maintenance."
            actionLabel="Add Equipment"
            onAction={() => router.push('/equipment/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/equipment/create')}
        icon="add"
        label="Add Equipment"
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
