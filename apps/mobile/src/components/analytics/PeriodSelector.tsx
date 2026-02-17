import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FilterChip } from '../ui';
import { spacing } from '../../theme';

export type Period = 'month' | '3months' | 'year' | 'all';

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'month', label: 'This Month' },
  { key: '3months', label: '3 Months' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export function getDateRange(period: Period): { startDate?: string; endDate?: string } {
  const now = new Date();
  const endDate = now.toISOString();

  switch (period) {
    case 'month':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate,
      };
    case '3months':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
        endDate,
      };
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
        endDate,
      };
    case 'all':
      return {};
  }
}

export function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {PERIODS.map((p) => (
        <FilterChip
          key={p.key}
          label={p.label}
          active={selected === p.key}
          onPress={() => onSelect(p.key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
});
