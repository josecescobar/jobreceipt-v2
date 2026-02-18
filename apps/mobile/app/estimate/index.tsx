import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { useEstimates } from '../../src/hooks/useEstimates';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT', label: 'Sent' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'CONVERTED', label: 'Converted' },
] as const;

function getStatusStyle(status: string, colors: ThemeColors) {
  switch (status) {
    case 'DRAFT':
      return { bg: colors.textMuted + '20', text: colors.textMuted };
    case 'SENT':
      return { bg: colors.primary + '20', text: colors.primary };
    case 'ACCEPTED':
      return { bg: colors.success + '20', text: colors.success };
    case 'REJECTED':
      return { bg: colors.error + '20', text: colors.error };
    case 'EXPIRED':
      return { bg: colors.warning + '20', text: colors.warning };
    case 'CONVERTED':
      return { bg: '#9333ea20', text: '#9333ea' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted };
  }
}

export default function EstimatesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch } = useEstimates(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const estimates = data?.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const statusStyle = getStatusStyle(item.status, colors);
      return (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => router.push(`/estimate/${item.id}`)}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.estimateNumber}>{item.estimateNumber}</Text>
            <Text style={styles.rowSub} numberOfLines={1}>
              {item.job?.customerName
                ? `${item.job.customerName} - ${item.job.name}`
                : item.job?.name ?? ''}
            </Text>
            <Text style={styles.rowDate}>
              {new Date(item.issueDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowAmount}>{formatMoney(item.total)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <Screen padded={false}>
      <Header title="Estimates" showBack />

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = statusFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.label}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setStatusFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : estimates.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No estimates yet</Text>
          <Text style={styles.emptyDesc}>
            Create an estimate to send proposals and quotes to your customers.
          </Text>
        </View>
      ) : (
        <FlatList
          data={estimates}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/estimate/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    filterScroll: {
      flexGrow: 0,
    },
    filterRow: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: '#FFFFFF',
    },
    list: {
      paddingHorizontal: spacing.lg,
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
      marginRight: spacing.md,
    },
    estimateNumber: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    rowSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rowDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    rowRight: {
      alignItems: 'flex-end',
    },
    rowAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      marginBottom: 4,
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
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.md,
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    fab: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  });
