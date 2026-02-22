import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { useExpense, useDeleteExpense } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

const CATEGORY_ICONS: Record<string, string> = {
  MATERIALS: '🧱',
  LABOR: '👷',
  EQUIPMENT: '🔧',
  SUBCONTRACTOR: '🤝',
  OVERHEAD: '📋',
};

const CATEGORY_LABELS: Record<string, string> = {
  MATERIALS: 'Materials',
  LABOR: 'Labor',
  EQUIPMENT: 'Equipment',
  SUBCONTRACTOR: 'Subcontractor',
  OVERHEAD: 'Overhead',
};

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: expense, isLoading } = useExpense(id ?? '');
  const deleteExpense = useDeleteExpense();

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(() => jobsData?.pages?.flatMap((p) => p.data) ?? [], [jobsData]);
  const jobName = useMemo(
    () => jobs.find((j) => j.id === expense?.jobId)?.name ?? null,
    [jobs, expense?.jobId],
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Expense" showBack />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!expense) {
    return (
      <Screen>
        <Header title="Expense" showBack />
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Expense not found.</Text>
        </View>
      </Screen>
    );
  }

  const categoryIcon = expense.category ? (CATEGORY_ICONS[expense.category] ?? '💰') : '💰';
  const categoryLabel = expense.category
    ? (CATEGORY_LABELS[expense.category] ?? expense.category)
    : 'Uncategorized';

  return (
    <Screen>
      <Header
        title="Expense Detail"
        showBack
        rightAction={{ icon: 'pencil', onPress: () => router.push(`/expense/edit/${id}`) }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount hero card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatMoney(expense.amount)}</Text>
          {expense.approvedAt && (
            <View style={styles.approvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.approvedText}>Approved</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Description</Text>
            <Text style={styles.rowValue} numberOfLines={2}>{expense.description || '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Category</Text>
            <View style={styles.rowRight}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
              <Text style={styles.rowValue}>{categoryLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>{formatDate(expense.date)}</Text>
          </View>

          {expense.taxCategory != null && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Tax Category</Text>
                <Text style={styles.rowValue}>{expense.taxCategory}</Text>
              </View>
            </>
          )}
        </View>

        {/* Job / Receipt links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => expense.jobId && router.push(`/job/${expense.jobId}`)}
            disabled={!expense.jobId}
          >
            <Text style={styles.rowLabel}>Job</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, expense.jobId ? styles.link : null]}>
                {jobName ?? (expense.jobId ? 'View Job' : 'Unassigned')}
              </Text>
              {expense.jobId && (
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>

          {expense.receiptId != null && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/receipt/${expense.receiptId}`)}
              >
                <Text style={styles.rowLabel}>Receipt</Text>
                <View style={styles.rowRight}>
                  <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                  <Text style={[styles.rowValue, styles.link]}>View Receipt</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Created</Text>
            <Text style={styles.rowValue}>
              {formatDate(new Date(expense.createdAt).toISOString().split('T')[0])}
            </Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleteExpense.isPending}
        >
          {deleteExpense.isPending ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mutedText: { color: colors.textMuted, fontSize: 16 },
    editButton: { padding: spacing.xs },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    amountCard: {
      backgroundColor: colors.primary + '18',
      borderRadius: 16,
      padding: spacing.xl,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    amountLabel: {
      fontSize: 13, fontWeight: '600', color: colors.primary,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs,
    },
    amountValue: { fontSize: 36, fontWeight: '700', color: colors.text },
    approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
    approvedText: { fontSize: 13, color: colors.success, fontWeight: '600' },
    section: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: spacing.sm,
    },
    rowLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    rowValue: { fontSize: 14, fontWeight: '500', color: colors.text, textAlign: 'right', flex: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 2, justifyContent: 'flex-end' },
    categoryIcon: { fontSize: 16 },
    link: { color: colors.primary },
    divider: { height: 1, backgroundColor: colors.border, opacity: 0.5 },
    deleteButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.md, borderRadius: 12,
      borderWidth: 1, borderColor: colors.error + '40', backgroundColor: colors.error + '10',
    },
    deleteText: { fontSize: 15, fontWeight: '600', color: colors.error },
  });
