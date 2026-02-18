import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useCrewAssignments } from '../../src/hooks/useCrewScheduling';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { CrewAssignment, CrewAssignmentStatus } from '@jobreceipt/shared';

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

const STATUS_CONFIG: Record<CrewAssignmentStatus, { label: string; colorKey: 'primary' | 'success' | 'error' }> = {
  SCHEDULED: { label: 'Scheduled', colorKey: 'primary' },
  COMPLETED: { label: 'Completed', colorKey: 'success' },
  NO_SHOW: { label: 'No Show', colorKey: 'error' },
};

export default function CrewSchedulingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = toDateString(selectedDate);

  const { data, isLoading, refetch, isRefetching } = useCrewAssignments({ date: dateStr });

  const assignments = data?.data ?? [];

  const goToPrevDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CrewAssignment }) => {
      const config = STATUS_CONFIG[item.status];
      const statusColor = colors[config.colorKey];

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/crew-scheduling/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardJobName}>{item.job?.name ?? 'Unknown Job'}</Text>
              <Text style={styles.cardCrewName}>{item.user?.name ?? 'Unnamed'}</Text>
              {(item.startTime || item.endTime) && (
                <Text style={styles.cardTime}>
                  {item.startTime ?? '--:--'} - {item.endTime ?? '--:--'}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {config.label}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Crew Scheduling" showBack />
      <FlatList
        data={assignments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={goToPrevDay} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToToday} style={styles.dateDisplay}>
              <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
              {toDateString(selectedDate) !== toDateString(new Date()) && (
                <Text style={styles.todayHint}>Tap for today</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={goToNextDay} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Assignments"
            message="No crew assigned for this date. Tap the button below to assign crew."
            actionLabel="Assign Crew"
            onAction={() => router.push('/crew-scheduling/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/crew-scheduling/create')}
        icon="add"
        label="Assign Crew"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      padding: spacing.lg,
      paddingBottom: 100,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateDisplay: {
      alignItems: 'center',
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    todayHint: {
      fontSize: 11,
      color: colors.primary,
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    cardJobName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    cardCrewName: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardTime: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
