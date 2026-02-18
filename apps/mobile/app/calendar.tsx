import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../src/components/layout';
import { useCalendarData } from '../src/hooks/useCalendar';
import { formatMoney } from '../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../src/theme';

const EVENT_ICONS: Record<string, string> = {
  expense: 'wallet-outline',
  time_entry: 'time-outline',
  mileage: 'car-outline',
  invoice_due: 'document-text-outline',
  recurring_expense: 'repeat-outline',
};

function getMonthRange(dateStr: string) {
  const d = new Date(dateStr + '-01');
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getCurrentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthStr);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(
    () => getMonthRange(currentMonth),
    [currentMonth],
  );
  const { data: calendarData, isLoading } = useCalendarData({ startDate, endDate });

  const dotColors: Record<string, string> = useMemo(
    () => ({
      expense: colors.primary,
      time_entry: colors.success,
      mileage: colors.warning,
      invoice_due: colors.error,
      recurring_expense: colors.textMuted,
    }),
    [colors],
  );

  const markedDates = useMemo(() => {
    if (!calendarData?.days) return {};
    const marks: Record<string, any> = {};

    for (const [dateKey, events] of Object.entries(calendarData.days)) {
      const types = [...new Set(events.map((e: any) => e.type))];
      const dots = types.map((type) => ({
        key: type,
        color: dotColors[type] || colors.textMuted,
      }));
      marks[dateKey] = {
        dots,
        selected: dateKey === selectedDate,
        selectedColor: colors.primary + '20',
        selectedTextColor: colors.primary,
      };
    }

    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: colors.primary + '20',
        selectedTextColor: colors.primary,
        dots: [],
      };
    }

    return marks;
  }, [calendarData, selectedDate, dotColors, colors]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate || !calendarData?.days) return [];
    return calendarData.days[selectedDate] ?? [];
  }, [selectedDate, calendarData]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleMonthChange = useCallback((month: DateData) => {
    setCurrentMonth(
      `${month.year}-${String(month.month).padStart(2, '0')}`,
    );
    setSelectedDate(null);
  }, []);

  const handleEventPress = useCallback(
    (event: any) => {
      switch (event.type) {
        case 'expense':
          router.push(`/expense/${event.id}`);
          break;
        case 'time_entry':
          router.push(`/time-tracking/edit/${event.id}`);
          break;
        case 'mileage':
          router.push(`/mileage/edit/${event.id}`);
          break;
        case 'invoice_due':
          router.push(`/invoice/${event.id}`);
          break;
        default:
          break;
      }
    },
    [router],
  );

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.textMuted,
      dayTextColor: colors.text,
      todayTextColor: colors.primary,
      monthTextColor: colors.text,
      arrowColor: colors.primary,
      textDisabledColor: colors.textMuted + '60',
      dotStyle: { width: 6, height: 6, borderRadius: 3 },
    }),
    [colors],
  );

  return (
    <Screen padded={false}>
      <Header title="Calendar" showBack />

      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        theme={calendarTheme}
        style={styles.calendar}
      />

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Day detail */}
      {selectedDate && (
        <View style={styles.dayDetail}>
          <Text style={styles.dayDetailHeader}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {selectedEvents.length > 0 ? (
            <FlatList
              data={selectedEvents}
              keyExtractor={(item: any) => `${item.type}-${item.id}`}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={styles.eventCard}
                  onPress={() => handleEventPress(item)}
                >
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: dotColors[item.type] || colors.textMuted },
                    ]}
                  />
                  <Ionicons
                    name={(EVENT_ICONS[item.type] || 'ellipse-outline') as any}
                    size={20}
                    color={dotColors[item.type] || colors.textMuted}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.eventType}>
                      {item.type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  {item.amount != null && (
                    <Text style={styles.eventAmount}>{formatMoney(item.amount)}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.eventList}
            />
          ) : (
            <Text style={styles.noEvents}>No activity on this day</Text>
          )}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    calendar: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    loadingRow: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    dayDetail: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    dayDetailHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      paddingVertical: spacing.md,
    },
    eventList: {
      paddingBottom: spacing.xxxl,
    },
    eventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    eventDot: {
      width: 4,
      height: 32,
      borderRadius: 2,
    },
    eventInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    eventType: {
      fontSize: 12,
      color: colors.textMuted,
      textTransform: 'capitalize',
      marginTop: 2,
    },
    eventAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    noEvents: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
  });
