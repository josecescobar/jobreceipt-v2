import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { ExpenseCard, ExpenseFilterBar, BatchActionBar } from '../../src/components/expenses';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { useUIStore } from '../../src/stores/ui.store';
import { colors, spacing } from '../../src/theme';

export default function ExpensesScreen() {
  const router = useRouter();
  const {
    expenseJobFilter,
    expenseCategoryFilter,
    expenseMerchantSearch,
    expenseDateFrom,
    expenseDateTo,
    expenseSelectionMode,
    selectedExpenseIds,
    enterExpenseSelectionMode,
    toggleExpenseSelection,
    selectAllExpenses,
    clearExpenseSelection,
  } = useUIStore();

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(expenseMerchantSearch);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(expenseMerchantSearch), 300);
    return () => clearTimeout(timer);
  }, [expenseMerchantSearch]);

  const queryParams = useMemo(
    () => ({
      jobId: expenseJobFilter || undefined,
      category: expenseCategoryFilter || undefined,
      search: debouncedSearch || undefined,
      startDate: expenseDateFrom || undefined,
      endDate: expenseDateTo || undefined,
    }),
    [expenseJobFilter, expenseCategoryFilter, debouncedSearch, expenseDateFrom, expenseDateTo],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useExpenses(queryParams);

  const expenses = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const jobNameMap = useMemo(
    () => Object.fromEntries(jobs.map((j) => [j.id, j.name])),
    [jobs],
  );

  const handleLongPress = useCallback(
    (id: string) => {
      enterExpenseSelectionMode();
      toggleExpenseSelection(id);
    },
    [enterExpenseSelectionMode, toggleExpenseSelection],
  );

  const allExpenseIds = useMemo(() => expenses.map((e) => e.id), [expenses]);
  const allSelected = allExpenseIds.length > 0 && selectedExpenseIds.length === allExpenseIds.length;

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <ExpenseFilterBar jobs={jobs} />

      {expenseSelectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity
            onPress={() =>
              allSelected ? selectAllExpenses([]) : selectAllExpenses(allExpenseIds)
            }
          >
            <Text style={styles.selectAllText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearExpenseSelection}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            jobName={item.jobId ? jobNameMap[item.jobId] : undefined}
            onPress={() => router.push(`/expense/edit/${item.id}`)}
            selectionMode={expenseSelectionMode}
            selected={selectedExpenseIds.includes(item.id)}
            onLongPress={() => handleLongPress(item.id)}
            onSelect={() => toggleExpenseSelection(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Expenses Yet"
            message="Add your first expense or scan a receipt."
            actionLabel="Add Expense"
            onAction={() => router.push('/expense/create')}
          />
        }
      />

      {!expenseSelectionMode && (
        <FAB
          onPress={() => router.push('/expense/create')}
          icon="add"
          label="Add Expense"
        />
      )}

      <BatchActionBar jobs={jobs} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
