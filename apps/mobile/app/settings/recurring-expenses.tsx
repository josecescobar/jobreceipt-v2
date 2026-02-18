import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { EmptyState, FAB } from '../../src/components/ui';
import { useRecurringExpenses } from '../../src/hooks/useRecurringExpenses';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { RecurringExpense } from '@jobreceipt/shared';

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 Weeks',
  MONTHLY: 'Monthly',
};

export default function RecurringExpensesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useRecurringExpenses();

  const items = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  const renderItem = ({ item }: { item: RecurringExpense }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/recurring-expense/edit/${item.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
          {item.job && (
            <Text style={styles.jobName} numberOfLines={1}>
              {item.job.name}
            </Text>
          )}
        </View>
        <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.badges}>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>
              {FREQUENCY_LABELS[item.frequency] || item.frequency}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? colors.success + '20' : colors.textMuted + '20' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isActive ? colors.success : colors.textMuted },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.isActive ? colors.success : colors.textMuted },
              ]}
            >
              {item.isActive ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>
        <Text style={styles.nextDate}>
          Next: {formatDate(item.nextOccurrence)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen padded={false}>
      <Header title="Recurring Expenses" showBack />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="No Recurring Expenses"
              message="Set up automatic expenses for regular costs like fuel, insurance, or tool rentals."
            />
          )
        }
      />
      <FAB
        icon="add"
        onPress={() => router.push('/recurring-expense/create')}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl * 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    cardInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    description: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    jobName: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    amount: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    badges: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    frequencyBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.primary + '15',
    },
    frequencyText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    nextDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
