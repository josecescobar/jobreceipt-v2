import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../src/api/jobs';
import { expensesApi } from '../src/api/expenses';
import { receiptsApi } from '../src/api/receipts';
import { Badge } from '../src/components/ui';
import { ReceiptStatusBadge } from '../src/components/receipt';
import { formatMoney, formatDate } from '../src/lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius, MIN_TOUCH_TARGET } from '../src/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: colors.success + '20', text: colors.success },
    COMPLETED: { bg: colors.primary + '20', text: colors.primary },
    ARCHIVED: { bg: colors.textMuted + '20', text: colors.textMuted },
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const enabled = debouncedQuery.length >= 2;

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['search', 'jobs', debouncedQuery],
    queryFn: () => jobsApi.list({ search: debouncedQuery, limit: 5 }),
    enabled,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['search', 'expenses', debouncedQuery],
    queryFn: () => expensesApi.list({ search: debouncedQuery, limit: 5 }),
    enabled,
  });

  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: ['search', 'receipts', debouncedQuery],
    queryFn: () => receiptsApi.list({ merchantName: debouncedQuery, limit: 5 }),
    enabled,
  });

  const jobs = jobsData?.data ?? [];
  const expenses = expensesData?.data ?? [];
  const receipts = receiptsData?.data ?? [];
  const isLoading = jobsLoading || expensesLoading || receiptsLoading;
  const hasResults = jobs.length > 0 || expenses.length > 0 || receipts.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search jobs, expenses, receipts..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!enabled && (
          <View style={styles.idleContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.idleText}>
              Search jobs, expenses, and receipts
            </Text>
          </View>
        )}

        {enabled && isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        )}

        {enabled && !isLoading && !hasResults && (
          <View style={styles.idleContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.idleText}>No results found</Text>
          </View>
        )}

        {/* Jobs */}
        {jobs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Jobs</Text>
            {jobs.map((job) => {
              const statusStyle = STATUS_COLORS[job.status] || STATUS_COLORS.ACTIVE;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={styles.row}
                  onPress={() => router.push(`/job/${job.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{job.name}</Text>
                    {job.customerName && (
                      <Text style={styles.rowSub} numberOfLines={1}>{job.customerName}</Text>
                    )}
                  </View>
                  <Badge
                    label={job.status}
                    color={statusStyle.text}
                    backgroundColor={statusStyle.bg}
                  />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Expenses */}
        {expenses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Expenses</Text>
            {expenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.row}
                onPress={() => router.push(`/expense/edit/${expense.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="wallet-outline" size={18} color={colors.success} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {expense.description || 'Expense'}
                  </Text>
                  <Text style={styles.rowSub}>
                    {expense.date ? formatDate(expense.date.toString()) : ''}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>{formatMoney(expense.amount)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Receipts */}
        {receipts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Receipts</Text>
            {receipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                style={styles.row}
                onPress={() => router.push(`/receipt/${receipt.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.review + '15' }]}>
                  <Ionicons name="receipt-outline" size={18} color={colors.review} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {receipt.merchantName || 'Unknown Merchant'}
                  </Text>
                  <View style={styles.receiptSub}>
                    {receipt.transactionDate && (
                      <Text style={styles.rowSub}>
                        {formatDate(receipt.transactionDate.toString())}
                      </Text>
                    )}
                    <ReceiptStatusBadge status={receipt.status} />
                  </View>
                </View>
                <Text style={styles.rowAmount}>
                  {receipt.totalAmount != null ? formatMoney(receipt.totalAmount) : '—'}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  idleContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  idleText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  loadingContainer: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: 14,
    color: colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  receiptSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
