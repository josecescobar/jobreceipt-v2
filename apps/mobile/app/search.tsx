import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { invoicesApi } from '../src/api/invoices';
import { customersApi } from '../src/api/customers';
import { equipmentApi } from '../src/api/equipment';
import { materialsApi } from '../src/api/materials';
import { documentsApi } from '../src/api/documents';
import { Badge } from '../src/components/ui';
import { ReceiptStatusBadge } from '../src/components/receipt';
import { formatMoney, formatDate } from '../src/lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius, MIN_TOUCH_TARGET } from '../src/theme';

type FilterType = 'all' | 'jobs' | 'expenses' | 'receipts' | 'invoices' | 'customers' | 'equipment' | 'materials' | 'documents';

const FILTER_CHIPS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'customers', label: 'Customers' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'materials', label: 'Materials' },
  { key: 'documents', label: 'Documents' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: colors.success + '20', text: colors.success },
    COMPLETED: { bg: colors.primary + '20', text: colors.primary },
    ARCHIVED: { bg: colors.textMuted + '20', text: colors.textMuted },
  };

  const INVOICE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: colors.textMuted + '20', text: colors.textMuted },
    SENT: { bg: colors.primary + '20', text: colors.primary },
    PARTIALLY_PAID: { bg: colors.warning + '20', text: colors.warning },
    PAID: { bg: colors.success + '20', text: colors.success },
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
  const isFiltered = activeFilter !== 'all';
  const defaultLimit = 5;

  // --- Jobs ---
  const showJobs = activeFilter === 'all' || activeFilter === 'jobs';
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['search', 'jobs', debouncedQuery, activeFilter],
    queryFn: () => jobsApi.list({ search: debouncedQuery, limit: activeFilter === 'jobs' ? 50 : defaultLimit }),
    enabled: enabled && showJobs,
  });

  // --- Expenses ---
  const showExpenses = activeFilter === 'all' || activeFilter === 'expenses';
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['search', 'expenses', debouncedQuery, activeFilter],
    queryFn: () => expensesApi.list({ search: debouncedQuery, limit: activeFilter === 'expenses' ? 50 : defaultLimit }),
    enabled: enabled && showExpenses,
  });

  // --- Receipts ---
  const showReceipts = activeFilter === 'all' || activeFilter === 'receipts';
  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: ['search', 'receipts', debouncedQuery, activeFilter],
    queryFn: () => receiptsApi.list({ merchantName: debouncedQuery, limit: activeFilter === 'receipts' ? 50 : defaultLimit }),
    enabled: enabled && showReceipts,
  });

  // --- Invoices ---
  const showInvoices = activeFilter === 'all' || activeFilter === 'invoices';
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['search', 'invoices', debouncedQuery, activeFilter],
    queryFn: () => invoicesApi.list({ search: debouncedQuery, limit: activeFilter === 'invoices' ? 50 : defaultLimit }),
    enabled: enabled && showInvoices,
  });

  // --- Customers ---
  const showCustomers = activeFilter === 'all' || activeFilter === 'customers';
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['search', 'customers', debouncedQuery, activeFilter],
    queryFn: () => customersApi.list({ search: debouncedQuery, limit: activeFilter === 'customers' ? 50 : defaultLimit }),
    enabled: enabled && showCustomers,
  });

  // --- Equipment ---
  const showEquipment = activeFilter === 'all' || activeFilter === 'equipment';
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ['search', 'equipment', debouncedQuery, activeFilter],
    queryFn: () => equipmentApi.list({ search: debouncedQuery, limit: activeFilter === 'equipment' ? 50 : defaultLimit }),
    enabled: enabled && showEquipment,
  });

  // --- Materials ---
  const showMaterials = activeFilter === 'all' || activeFilter === 'materials';
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['search', 'materials', debouncedQuery, activeFilter],
    queryFn: () => materialsApi.list({ search: debouncedQuery, limit: activeFilter === 'materials' ? 50 : defaultLimit }),
    enabled: enabled && showMaterials,
  });

  // --- Documents ---
  const showDocuments = activeFilter === 'all' || activeFilter === 'documents';
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['search', 'documents', debouncedQuery, activeFilter],
    queryFn: () => documentsApi.list({ search: debouncedQuery, limit: activeFilter === 'documents' ? 50 : defaultLimit }),
    enabled: enabled && showDocuments,
  });

  const jobs = jobsData?.data ?? [];
  const expenses = expensesData?.data ?? [];
  const receipts = receiptsData?.data ?? [];
  const invoices = invoicesData?.data ?? [];
  const customers = customersData?.data ?? [];
  const equipment = equipmentData?.data ?? [];
  const materials = materialsData?.data ?? [];
  const documents = documentsData?.data ?? [];

  const isLoading =
    (showJobs && jobsLoading) ||
    (showExpenses && expensesLoading) ||
    (showReceipts && receiptsLoading) ||
    (showInvoices && invoicesLoading) ||
    (showCustomers && customersLoading) ||
    (showEquipment && equipmentLoading) ||
    (showMaterials && materialsLoading) ||
    (showDocuments && documentsLoading);

  const hasResults =
    jobs.length > 0 ||
    expenses.length > 0 ||
    receipts.length > 0 ||
    invoices.length > 0 ||
    customers.length > 0 ||
    equipment.length > 0 ||
    materials.length > 0 ||
    documents.length > 0;

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
            placeholder="Search everything..."
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[
                styles.chip,
                { backgroundColor: isActive ? colors.primary : colors.surface },
              ]}
              onPress={() => setActiveFilter(chip.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFFFFF' : colors.text },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
              Search everything across your workspace
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
        {showJobs && jobs.length > 0 && (
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
        {showExpenses && expenses.length > 0 && (
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
        {showReceipts && receipts.length > 0 && (
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

        {/* Invoices */}
        {showInvoices && invoices.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Invoices</Text>
            {invoices.map((invoice) => {
              const statusStyle = INVOICE_STATUS_COLORS[invoice.status] || INVOICE_STATUS_COLORS.DRAFT;
              return (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.row}
                  onPress={() => router.push(`/invoice/${invoice.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {invoice.invoiceNumber}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {[
                        invoice.job?.name,
                        invoice.status,
                        formatMoney(invoice.total),
                      ].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Badge
                    label={invoice.status}
                    color={statusStyle.text}
                    backgroundColor={statusStyle.bg}
                  />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Customers */}
        {showCustomers && customers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Customers</Text>
            {customers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={styles.row}
                onPress={() => router.push(`/customer/${customer.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="person-outline" size={18} color={colors.success} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {customer.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {[customer.companyName, customer.email].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Equipment */}
        {showEquipment && equipment.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Equipment</Text>
            {equipment.map((item) => {
              const eqStatusStyle = STATUS_COLORS[item.status] || { bg: colors.textMuted + '20', text: colors.textMuted };
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => router.push(`/equipment/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="construct-outline" size={18} color={colors.warning} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {[item.type, item.status].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Materials */}
        {showMaterials && materials.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Materials</Text>
            {materials.map((material) => {
              const inStock = material.purchasedQty - material.usedQty;
              return (
                <TouchableOpacity
                  key={material.id}
                  style={styles.row}
                  onPress={() => router.push(`/material/${material.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="cube-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {material.name}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {[material.unit, `${inStock} in stock`].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Documents */}
        {showDocuments && documents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, typography.label]}>Documents</Text>
            {documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.row}
                onPress={() => router.push(`/document/${doc.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.textMuted + '15' }]}>
                  <Ionicons name="folder-outline" size={18} color={colors.textMuted} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {[doc.type, formatDate(doc.createdAt)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
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
  chipScroll: {
    flexGrow: 0,
  },
  chipContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
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
