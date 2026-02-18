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
import { useInvoices } from '../../src/hooks/useInvoices';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT', label: 'Sent' },
  { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { key: 'PAID', label: 'Paid' },
] as const;

function getStatusStyle(status: string, colors: ThemeColors) {
  switch (status) {
    case 'DRAFT':
      return { bg: colors.textMuted + '20', text: colors.textMuted };
    case 'SENT':
      return { bg: colors.primary + '20', text: colors.primary };
    case 'PARTIALLY_PAID':
      return { bg: colors.warning + '20', text: colors.warning };
    case 'PAID':
      return { bg: colors.success + '20', text: colors.success };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted };
  }
}

function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'PAID') return false;
  return new Date(dueDate) < new Date();
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'PARTIALLY_PAID':
      return 'Partial';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export default function InvoicesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const params = statusFilter ? { status: statusFilter } : undefined;
  const { data, isLoading, refetch, isRefetching } = useInvoices(params);
  const invoices = (data as any)?.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const statusStyle = getStatusStyle(item.status, colors);
      const overdue = isOverdue(item.dueDate, item.status);

      return (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => router.push(`/invoice/${item.id}`)}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            {item.job?.name ? (
              <Text style={styles.jobName} numberOfLines={1}>
                {item.job.name}
              </Text>
            ) : null}
            {item.job?.customerName ? (
              <Text style={styles.customerName} numberOfLines={1}>
                {item.job.customerName}
              </Text>
            ) : null}
            {item.dueDate ? (
              <Text style={[styles.dueDate, overdue && styles.overdue]}>
                {overdue ? 'Overdue: ' : 'Due: '}
                {formatDate(item.dueDate)}
              </Text>
            ) : null}
          </View>

          <View style={styles.rowRight}>
            <Text style={styles.rowAmount}>{formatMoney(item.total)}</Text>
            {item.paidAmount > 0 && item.status !== 'PAID' ? (
              <Text style={styles.paidAmount}>Paid: {formatMoney(item.paidAmount)}</Text>
            ) : null}
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {formatStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
            style={styles.chevron}
          />
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <Screen padded={false}>
      <Header title="Invoices" showBack />

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
      ) : invoices.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Invoices</Text>
          <Text style={styles.emptyDesc}>
            Create your first invoice to start billing clients.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/invoice/create')}
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
    invoiceNumber: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    jobName: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    customerName: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    dueDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    overdue: {
      color: colors.error,
      fontWeight: '600',
    },
    rowRight: {
      alignItems: 'flex-end',
      marginRight: spacing.xs,
    },
    rowAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      marginBottom: 2,
    },
    paidAmount: {
      fontSize: 11,
      color: colors.success,
      fontWeight: '600',
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
    chevron: {
      marginLeft: spacing.xs,
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
