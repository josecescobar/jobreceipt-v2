import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useSOVList } from '../../src/hooks/useProgressBilling';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const getStatusStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'DRAFT':
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: 'Draft' };
    case 'SUBMITTED':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Submitted' };
    case 'APPROVED':
      return { bg: colors.success + '20', text: colors.success, label: 'Approved' };
    case 'PAID':
      return { bg: colors.primary + '20', text: colors.primary, label: 'Paid' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

export default function ProgressBillingListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching,
  } = useSOVList();

  const items = listData?.data ?? [];

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Progress Billing" showBack />

      <FlatList
        data={items}
        renderItem={({ item }) => {
          const latestDR = item.latestDrawRequest;
          const statusStyle = latestDR
            ? getStatusStyle(latestDR.status, colors)
            : null;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/progress-billing/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.job?.name ?? 'Unknown Job'}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>
                      {item.itemCount} item{item.itemCount !== 1 ? 's' : ''}
                    </Text>
                    {item.drawRequestCount > 0 && (
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="layers-outline"
                          size={11}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {item.drawRequestCount} draw{item.drawRequestCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {latestDR && statusStyle && (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusStyle.text }]}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  )}
                  {latestDR && (
                    <Text style={styles.amountText}>
                      {formatMoney(latestDR.currentPaymentDue)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Schedules of Values"
            message="Create a Schedule of Values to start tracking progress billing for your jobs."
            actionLabel="Create SOV"
            onAction={() => router.push('/progress-billing/create-sov')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/progress-billing/create-sov')}
        icon="add"
        label="Create SOV"
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
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    cardRight: {
      alignItems: 'flex-end',
      gap: 4,
      marginLeft: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
    },
    amountText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
  });
