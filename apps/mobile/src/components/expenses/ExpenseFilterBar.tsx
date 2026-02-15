import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { FilterChip, Input } from '../ui';
import { useUIStore } from '../../stores/ui.store';
import { spacing } from '../../theme';
import type { Job } from '@jobreceipt/shared';

interface ExpenseFilterBarProps {
  jobs: Job[];
}

const CATEGORIES = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD'];

export function ExpenseFilterBar({ jobs }: ExpenseFilterBarProps) {
  const {
    expenseJobFilter,
    expenseCategoryFilter,
    expenseMerchantSearch,
    setExpenseJobFilter,
    setExpenseCategoryFilter,
    setExpenseMerchantSearch,
  } = useUIStore();

  return (
    <View style={styles.container}>
      <Input
        value={expenseMerchantSearch}
        onChangeText={setExpenseMerchantSearch}
        placeholder="Search merchant..."
        style={styles.searchInput}
      />

      {/* Job filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <FilterChip
          label="All Jobs"
          active={!expenseJobFilter}
          onPress={() => setExpenseJobFilter(null)}
        />
        {jobs.map((job) => (
          <FilterChip
            key={job.id}
            label={job.name}
            active={expenseJobFilter === job.id}
            onPress={() =>
              setExpenseJobFilter(expenseJobFilter === job.id ? null : job.id)
            }
          />
        ))}
      </ScrollView>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <FilterChip
          label="All Categories"
          active={!expenseCategoryFilter}
          onPress={() => setExpenseCategoryFilter(null)}
        />
        {CATEGORIES.map((cat) => (
          <FilterChip
            key={cat}
            label={cat.charAt(0) + cat.slice(1).toLowerCase()}
            active={expenseCategoryFilter === cat}
            onPress={() =>
              setExpenseCategoryFilter(expenseCategoryFilter === cat ? null : cat)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  chips: {
    paddingBottom: spacing.sm,
  },
});
