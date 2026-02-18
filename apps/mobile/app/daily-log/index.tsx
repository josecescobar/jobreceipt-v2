import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useDailyLogs } from '../../src/hooks/useDailyLogs';
import { formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { WeatherCondition } from '@jobreceipt/shared';

const WEATHER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  SUNNY: 'sunny-outline',
  CLOUDY: 'cloud-outline',
  RAINY: 'rainy-outline',
  SNOWY: 'snow-outline',
  WINDY: 'flag-outline',
};

export default function DailyLogListScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useDailyLogs({ jobId: jobId! });

  const logs = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Daily Logs" showBack />
      <FlatList
        data={logs}
        renderItem={({ item }) => {
          const photoCount = (item as any)._count?.photos ?? 0;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/daily-log/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                <View style={styles.cardHeaderRight}>
                  {item.weather && (
                    <Ionicons
                      name={WEATHER_ICONS[item.weather] || 'partly-sunny-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  )}
                  {photoCount > 0 && (
                    <View style={styles.photoBadge}>
                      <Ionicons name="camera-outline" size={12} color={colors.primary} />
                      <Text style={styles.photoBadgeText}>{photoCount}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.cardWork} numberOfLines={2}>
                {item.workPerformed}
              </Text>

              <View style={styles.cardFooter}>
                {item.crewCount != null && item.crewCount > 0 && (
                  <View style={styles.cardMeta}>
                    <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.cardMetaText}>{item.crewCount} crew</Text>
                  </View>
                )}
                {item.hoursWorked != null && item.hoursWorked > 0 && (
                  <View style={styles.cardMeta}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.cardMetaText}>{item.hoursWorked}h</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Daily Logs"
            message="Start documenting your daily work on this job."
            actionLabel="Add Log"
            onAction={() => router.push(`/daily-log/create?jobId=${jobId}`)}
          />
        }
      />

      <FAB
        onPress={() => router.push(`/daily-log/create?jobId=${jobId}`)}
        icon="add"
        label="Add Log"
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    cardDate: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    cardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    photoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    photoBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    cardWork: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.sm,
    },
    cardFooter: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    cardMetaText: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
