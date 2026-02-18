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
  usePermitList,
  usePermitSummary,
} from '../../src/hooks/usePermits';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { Permit } from '@jobreceipt/shared';
import { formatDate } from '../../src/lib/format';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'ISSUED', label: 'Issued' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'REVOKED', label: 'Revoked' },
  { key: 'CLOSED', label: 'Closed' },
] as const;

const PERMIT_TYPE_LABELS: Record<string, string> = {
  BUILDING: 'Building',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  MECHANICAL: 'Mechanical',
  FIRE: 'Fire',
  DEMOLITION: 'Demolition',
  GRADING: 'Grading',
  OTHER: 'Other',
};

const getStatusBadgeStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'APPLIED':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Applied' };
    case 'ISSUED':
      return { bg: colors.success + '20', text: colors.success, label: 'Issued' };
    case 'EXPIRED':
      return { bg: colors.error + '20', text: colors.error, label: 'Expired' };
    case 'REVOKED':
      return { bg: colors.error + '20', text: colors.error, label: 'Revoked' };
    case 'CLOSED':
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: 'Closed' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

export default function PermitListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: summary } = usePermitSummary();
  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching,
  } = usePermitList({ status: statusFilter });

  const items = listData?.data ?? [];

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Permits" showBack />

      <FlatList
        data={items}
        ListHeaderComponent={
          <View>
            {/* Summary Card */}
            {summary && summary.total > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.warning }]}>
                      {summary.applied}
                    </Text>
                    <Text style={styles.summaryLabel}>Applied</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.success }]}>
                      {summary.issued}
                    </Text>
                    <Text style={styles.summaryLabel}>Issued</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: colors.error }]}>
                      {summary.expired}
                    </Text>
                    <Text style={styles.summaryLabel}>Expired</Text>
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
        renderItem={({ item }: { item: Permit }) => {
          const statusStyle = getStatusBadgeStyle(item.status, colors);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/permit/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.permitNumber || 'No Number'}
                  </Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {PERMIT_TYPE_LABELS[item.type] ?? item.type}
                      </Text>
                    </View>
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
                  </View>
                  {item.expiresAt && (
                    <Text style={styles.expiresText}>
                      Expires: {formatDate(item.expiresAt)}
                    </Text>
                  )}
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
            title="No Permits"
            message="Track building permits, inspections, and expiration dates for your jobs."
            actionLabel="Add Permit"
            onAction={() => router.push('/permit/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/permit/create')}
        icon="add"
        label="Add Permit"
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
    typeBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.sm,
      paddingVertical: 1,
      borderRadius: borderRadius.full,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
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
    expiresText: {
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
