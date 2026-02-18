import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import {
  useMaterialItems,
  useJobMaterialSummary,
  useInventorySummary,
} from '../../src/hooks/useMaterials';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { MaterialItem } from '@jobreceipt/shared';

const CATEGORY_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'LUMBER', label: 'Lumber' },
  { key: 'ELECTRICAL', label: 'Electrical' },
  { key: 'PLUMBING', label: 'Plumbing' },
  { key: 'ROOFING', label: 'Roofing' },
  { key: 'HARDWARE', label: 'Hardware' },
  { key: 'PAINT', label: 'Paint' },
  { key: 'FASTENERS', label: 'Fasteners' },
  { key: 'CONCRETE', label: 'Concrete' },
  { key: 'INSULATION', label: 'Insulation' },
  { key: 'DRYWALL', label: 'Drywall' },
  { key: 'FLOORING', label: 'Flooring' },
  { key: 'TOOLS', label: 'Tools' },
  { key: 'SAFETY', label: 'Safety' },
  { key: 'OTHER', label: 'Other' },
] as const;

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function getOnHandColor(
  purchasedQty: number,
  usedQty: number,
  colors: ThemeColors,
): string {
  if (purchasedQty <= 0) return colors.textMuted;
  const ratio = (purchasedQty - usedQty) / purchasedQty;
  if (ratio > 0.5) return colors.success;
  if (ratio > 0.2) return colors.warning;
  return colors.error;
}

export default function MaterialListScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );

  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching,
  } = useMaterialItems({
    jobId,
    category: categoryFilter,
  });

  const { data: jobSummary } = useJobMaterialSummary(jobId || '');
  const { data: inventorySummary } = useInventorySummary();

  const summary = jobId ? jobSummary : inventorySummary;
  const items = listData?.data ?? [];
  const categoriesCount = summary?.categories?.length ?? 0;

  const renderItem = useCallback(
    ({ item }: { item: MaterialItem }) => {
      const onHand = item.purchasedQty - item.usedQty;
      const onHandColor = getOnHandColor(item.purchasedQty, item.usedQty, colors);

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/material/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.cardMeta}>
                {item.category && (
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: colors.primary + '15' },
                    ]}
                  >
                    <Text
                      style={[styles.categoryBadgeText, { color: colors.primary }]}
                    >
                      {item.category}
                    </Text>
                  </View>
                )}
                <Text style={styles.metaText}>
                  {item.usedQty}/{item.purchasedQty} used
                </Text>
                <Text style={styles.metaText}>
                  {formatCurrency(item.unitCost)}/{item.unit}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View
                style={[
                  styles.onHandBadge,
                  { backgroundColor: onHandColor + '20' },
                ]}
              >
                <Text style={[styles.onHandText, { color: onHandColor }]}>
                  {onHand} {item.unit}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Materials" showBack />

      <FlatList
        data={items}
        ListHeaderComponent={
          <View>
            {/* Summary Card */}
            {summary && summary.totalItems > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.totalItems}</Text>
                    <Text style={styles.summaryLabel}>Items</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(summary.totalValue)}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Value</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{categoriesCount}</Text>
                    <Text style={styles.summaryLabel}>Categories</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {CATEGORY_FILTERS.map((f) => {
                const active = categoryFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.label}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setCategoryFilter(f.key)}
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
            </ScrollView>
          </View>
        }
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Materials"
            message="Track materials and inventory for your jobs."
            actionLabel="Add Material"
            onAction={() =>
              router.push(
                jobId
                  ? `/material/create?jobId=${jobId}`
                  : '/material/create',
              )
            }
          />
        }
      />

      <FAB
        onPress={() =>
          router.push(
            jobId ? `/material/create?jobId=${jobId}` : '/material/create',
          )
        }
        icon="add"
        label="Add Material"
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
      justifyContent: 'space-between',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingBottom: spacing.lg,
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
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    metaText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    categoryBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    cardRight: {
      marginLeft: spacing.sm,
      alignItems: 'flex-end',
    },
    onHandBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    onHandText: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
