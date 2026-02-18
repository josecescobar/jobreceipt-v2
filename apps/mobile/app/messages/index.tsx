import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/layout';
import { useThreads } from '../../src/hooks/useMessages';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { JobThread } from '@jobreceipt/shared';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: threads, isLoading, refetch, isRefetching } = useThreads();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const renderThread = useCallback(
    ({ item }: { item: JobThread }) => (
      <TouchableOpacity
        style={styles.threadRow}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: '/messages/threads/[jobId]',
            params: { jobId: item.jobId, jobName: item.jobName },
          })
        }
      >
        <View style={styles.threadIcon}>
          <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadTopRow}>
            <Text style={styles.jobName} numberOfLines={1}>
              {item.jobName}
            </Text>
            <Text style={styles.timestamp}>
              {formatRelativeTime(item.lastMessage.createdAt)}
            </Text>
          </View>
          <View style={styles.threadBottomRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage.sender?.name
                ? `${item.lastMessage.sender.name}: `
                : ''}
              {item.lastMessage.body}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [colors, styles, router],
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Messages' }} />
      <Screen padded={false} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={threads ?? []}
            keyExtractor={(item) => item.jobId}
            renderItem={renderThread}
            contentContainerStyle={
              threads && threads.length > 0
                ? styles.listContent
                : styles.emptyContainer
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start a conversation from a job.
                </Text>
              </View>
            }
          />
        )}
      </Screen>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      minHeight: 56,
    },
    backBtn: {
      width: 40,
      minHeight: 48,
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    emptyContainer: {
      flex: 1,
    },
    threadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    threadIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    threadContent: {
      flex: 1,
    },
    threadTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    jobName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textMuted,
    },
    threadBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    preview: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      marginRight: spacing.sm,
    },
    badge: {
      backgroundColor: colors.error,
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
