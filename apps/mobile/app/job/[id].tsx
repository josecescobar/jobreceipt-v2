import React, { useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Header } from '../../src/components/layout';
import { MoneyText } from '../../src/components/ui';
import {
  OverBudgetBanner,
  BudgetBreakdownChart,
  CategoryBreakdownCard,
} from '../../src/components/jobs';
import { useJob } from '../../src/hooks/useJobs';
import { useBudget } from '../../src/hooks/useBudget';
import { useExpenses } from '../../src/hooks/useExpenses';
import { formatMoney, formatDate } from '../../src/lib/format';
import { colors, spacing, typography } from '../../src/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading: jobLoading } = useJob(id!);
  const {
    spent,
    budget,
    isOverBudget,
    remaining,
    color,
    categories,
    isLoading: budgetLoading,
  } = useBudget(id!);

  const { data: expensesData } = useExpenses({ jobId: id });
  const expenses = useMemo(
    () => expensesData?.pages?.flatMap((p) => p.data) ?? [],
    [expensesData],
  );

  if (jobLoading || !job) {
    return (
      <Screen padded={false}>
        <Header title="Job" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const chartData = [
    { label: 'Materials', ...categories.materials },
    { label: 'Labor', ...categories.labor },
    { label: 'Equip', ...categories.equipment },
    { label: 'Sub', ...categories.subcontractor },
    { label: 'Overhead', ...categories.overhead },
  ];

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title={job.name} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer */}
        {job.customerName && (
          <Text style={styles.customer}>{job.customerName}</Text>
        )}

        {/* Over budget alert */}
        {isOverBudget && (
          <OverBudgetBanner overBy={spent - budget} />
        )}

        {/* Total budget summary */}
        {budget > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Spent</Text>
                <MoneyText cents={spent} size="large" color={color} />
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryLabel}>Budget</Text>
                <MoneyText cents={budget} size="large" />
              </View>
            </View>
            <View style={styles.remainingRow}>
              <Text style={styles.remainingLabel}>
                {remaining >= 0 ? 'Remaining' : 'Over by'}
              </Text>
              <Text style={[styles.remainingValue, { color }]}>
                {formatMoney(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        )}

        {/* Budget breakdown chart */}
        {budget > 0 && <BudgetBreakdownChart data={chartData} />}

        {/* Category cards */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <CategoryBreakdownCard
          label="Materials"
          spent={categories.materials.spent}
          budget={categories.materials.budget}
        />
        <CategoryBreakdownCard
          label="Labor"
          spent={categories.labor.spent}
          budget={categories.labor.budget}
        />
        <CategoryBreakdownCard
          label="Equipment"
          spent={categories.equipment.spent}
          budget={categories.equipment.budget}
        />
        <CategoryBreakdownCard
          label="Subcontractor"
          spent={categories.subcontractor.spent}
          budget={categories.subcontractor.budget}
        />
        <CategoryBreakdownCard
          label="Overhead"
          spent={categories.overhead.spent}
          budget={categories.overhead.budget}
        />

        {/* Recent expenses */}
        <Text style={styles.sectionTitle}>
          Expenses ({expenses.length})
        </Text>
        {expenses.slice(0, 10).map((expense) => (
          <View key={expense.id} style={styles.expenseRow}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDesc} numberOfLines={1}>
                {expense.description || 'Expense'}
              </Text>
              <Text style={styles.expenseDate}>
                {expense.date ? formatDate(expense.date) : ''}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatMoney(expense.amount)}
            </Text>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customer: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  remainingLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    ...typography.label,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expenseInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  expenseDesc: {
    fontSize: 14,
    color: colors.text,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
