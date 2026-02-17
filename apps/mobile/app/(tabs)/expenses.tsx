import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { ExpenseCard, ExpenseFilterBar } from '../../src/components/expenses';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { useUIStore } from '../../src/stores/ui.store';
import { spacing } from '../../src/theme';

export default function ExpensesScreen() {
  const router = useRouter();
  const {
    expenseJobFilter,
    expenseCategoryFilter,
    expenseMerchantSearch,
    expenseDateFrom,
    expenseDateTo,
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

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen>
      <ExpenseFilterBar jobs={jobs} />

      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            jobName={item.jobId ? jobNameMap[item.jobId] : undefined}
            onPress={() => router.push(`/expense/edit/${item.id}`)}
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

      <FAB
        onPress={() => router.push('/expense/create')}
        icon="add"
        label="Add Expense"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
  },
});
