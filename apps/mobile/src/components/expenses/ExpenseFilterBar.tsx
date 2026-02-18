import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FilterChip, Input, DatePickerField } from '../ui';
import { useUIStore } from '../../stores/ui.store';
import { useTheme, type ThemeColors, spacing } from '../../theme';
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
    expenseDateFrom,
    expenseDateTo,
    setExpenseJobFilter,
    setExpenseCategoryFilter,
    setExpenseMerchantSearch,
    setExpenseDateRange,
  } = useUIStore();

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showDateRange, setShowDateRange] = useState(
    !!(expenseDateFrom || expenseDateTo),
  );

  const hasAnyFilter =
    !!expenseJobFilter ||
    !!expenseCategoryFilter ||
    !!expenseMerchantSearch ||
    !!expenseDateFrom ||
    !!expenseDateTo;

  const handleClearAll = () => {
    setExpenseJobFilter(null);
    setExpenseCategoryFilter(null);
    setExpenseMerchantSearch('');
    setExpenseDateRange(null, null);
    setShowDateRange(false);
  };

  return (
    <View style={styles.container}>
      <Input
        value={expenseMerchantSearch}
        onChangeText={setExpenseMerchantSearch}
        placeholder="Search expenses..."
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
        <FilterChip
          label="Date range"
          active={showDateRange}
          onPress={() => {
            if (showDateRange) {
              setExpenseDateRange(null, null);
            }
            setShowDateRange(!showDateRange);
          }}
        />
      </ScrollView>

      {/* Date range pickers */}
      {showDateRange && (
        <View style={styles.dateRow}>
          <View style={styles.datePicker}>
            <DatePickerField
              label="From"
              value={expenseDateFrom ?? ''}
              onChange={(d) => setExpenseDateRange(d, expenseDateTo)}
              placeholder="Start date"
            />
          </View>
          <View style={styles.datePicker}>
            <DatePickerField
              label="To"
              value={expenseDateTo ?? ''}
              onChange={(d) => setExpenseDateRange(expenseDateFrom, d)}
              placeholder="End date"
            />
          </View>
          {(expenseDateFrom || expenseDateTo) && (
            <TouchableOpacity
              style={styles.clearDates}
              onPress={() => setExpenseDateRange(null, null)}
            >
              <Text style={styles.clearDatesText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Clear all */}
      {hasAnyFilter && (
        <TouchableOpacity onPress={handleClearAll} style={styles.clearAll}>
          <Text style={styles.clearAllText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  chips: {
    paddingBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  datePicker: {
    flex: 1,
  },
  clearDates: {
    paddingBottom: spacing.lg + spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  clearDatesText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  clearAll: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
});
