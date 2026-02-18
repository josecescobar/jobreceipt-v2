import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useJobTemplates } from '../../src/hooks/useJobTemplates';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function JobTemplateListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useJobTemplates();

  const templates = data?.pages?.flatMap((p) => p.data) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const lineItemCount = item.lineItems?.length ?? 0;

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push(`/job-template/${item.id}`)}
        >
          <View style={styles.cardBody}>
            <View style={styles.cardLeft}>
              <Text style={styles.templateName}>{item.name}</Text>
              {!!item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View style={styles.metaRow}>
                {item.budgetTotal != null && item.budgetTotal > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="cash-outline"
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text style={styles.metaText}>
                      {formatMoney(item.budgetTotal)}
                    </Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons
                    name="list-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>
                    {lineItemCount} {lineItemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.useButton}
              activeOpacity={0.7}
              onPress={() => router.push(`/job/create?templateId=${item.id}`)}
            >
              <Text style={styles.useButtonText}>Use Template</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, styles, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Job Templates" showBack />

      <FlatList
        data={templates}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Job Templates"
            message="Create templates from your best jobs to speed up new project setup."
            actionLabel="Create Template"
            onAction={() => router.push('/job-template/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/job-template/create')}
        icon="add"
        label="New Template"
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
    cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    templateName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    description: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      gap: spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 13,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    useButton: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    useButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  });
