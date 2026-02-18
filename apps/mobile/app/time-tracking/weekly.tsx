import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { LoadingScreen } from '../../src/components/ui';
import { useTimeEntries, useTimeEntrySummary } from '../../src/hooks/useTimeTracking';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { TimeEntry } from '../../src/api/time-tracking';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSundayOfWeek(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(monday.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatWeekLabel(monday: Date): string {
  return `Week of ${SHORT_MONTHS[monday.getMonth()]} ${monday.getDate()}`;
}

interface DaySection {
  dayIndex: number;
  dayName: string;
  dateLabel: string;
  dailyMinutes: number;
  data: TimeEntry[];
}

export default function WeeklyTimesheetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [weekOffset, setWeekOffset] = useState(0);

  const { monday, sunday } = useMemo(() => {
    const now = new Date();
    const mon = getMondayOfWeek(now);
    mon.setDate(mon.getDate() + weekOffset * 7);
    return { monday: mon, sunday: getSundayOfWeek(mon) };
  }, [weekOffset]);

  const isThisWeek = weekOffset === 0;

  const startDate = monday.toISOString();
  const endDate = sunday.toISOString();

  const { data, isLoading, refetch, isRefetching } = useTimeEntries({
    startDate,
    endDate,
    limit: 200,
  });

  const { data: summary } = useTimeEntrySummary({ startDate, endDate });

  const entries = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  const sections: DaySection[] = useMemo(() => {
    const result: DaySection[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dayStr = dayDate.toISOString().split('T')[0];

      const dayEntries = entries.filter((e) => {
        const entryDate = new Date(e.date).toISOString().split('T')[0];
        return entryDate === dayStr;
      });

      const dailyMinutes = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

      result.push({
        dayIndex: i,
        dayName: DAY_NAMES[i],
        dateLabel: `${SHORT_MONTHS[dayDate.getMonth()]} ${dayDate.getDate()}`,
        dailyMinutes,
        data: dayEntries,
      });
    }
    return result;
  }, [entries, monday]);

  const goBack = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goForward = useCallback(() => setWeekOffset((o) => o + 1), []);
  const goToThisWeek = useCallback(() => setWeekOffset(0), []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Weekly Timesheet" showBack />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Week Selector */}
            <View style={styles.weekSelector}>
              <TouchableOpacity onPress={goBack} style={styles.arrowBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.weekLabel}>{formatWeekLabel(monday)}</Text>
              <TouchableOpacity onPress={goForward} style={styles.arrowBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </TouchableOpacity>
              {!isThisWeek && (
                <TouchableOpacity onPress={goToThisWeek} style={styles.thisWeekBtn} activeOpacity={0.7}>
                  <Text style={styles.thisWeekBtnText}>This Week</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionDayName}>{section.dayName}</Text>
              <Text style={styles.sectionDate}>{section.dateLabel}</Text>
            </View>
            <Text style={styles.sectionTotal}>
              {section.dailyMinutes > 0 ? formatDuration(section.dailyMinutes) : '-'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.entryCard}
            onPress={() => router.push(`/time-tracking/edit/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.entryLeft}>
              {item.job && <Text style={styles.entryJob}>{item.job.name}</Text>}
              {item.startTime && item.endTime && (
                <Text style={styles.entryTimeRange}>
                  {item.startTime} - {item.endTime}
                </Text>
              )}
            </View>
            <View style={styles.entryRight}>
              <Text
                style={[
                  styles.entryDuration,
                  item.overtimeMinutes > 0 && styles.overtimeText,
                ]}
              >
                {formatDuration(item.durationMinutes)}
              </Text>
              <Text style={styles.entryCost}>{formatMoney(item.totalCost)}</Text>
              {item.overtimeMinutes > 0 && (
                <Text style={styles.overtimeLabel}>
                  OT: {formatDuration(item.overtimeMinutes)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>No entries</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>Weekly Totals</Text>
            <View style={styles.totalsRow}>
              <View style={styles.totalsItem}>
                <Text style={styles.totalsLabel}>Regular</Text>
                <Text style={styles.totalsValue}>
                  {formatDuration(summary?.regularMinutes ?? 0)}
                </Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.totalsItem}>
                <Text style={styles.totalsLabel}>Overtime</Text>
                <Text style={[styles.totalsValue, (summary?.overtimeMinutes ?? 0) > 0 && styles.overtimeText]}>
                  {formatDuration(summary?.overtimeMinutes ?? 0)}
                </Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.totalsItem}>
                <Text style={styles.totalsLabel}>Total Cost</Text>
                <Text style={styles.totalsValue}>
                  {formatMoney(summary?.totalCost ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        }
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  thisWeekBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  thisWeekBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  sectionDayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  entryJob: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  entryTimeRange: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryDuration: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  entryCost: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  overtimeText: {
    color: colors.warning,
  },
  overtimeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
    marginTop: 2,
  },
  emptyDay: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalsItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalsDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  totalsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  totalsValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
