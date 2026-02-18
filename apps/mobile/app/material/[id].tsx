import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, LoadingScreen } from '../../src/components/ui';
import {
  useMaterialItem,
  useDeleteMaterial,
} from '../../src/hooks/useMaterials';
import { formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

export default function MaterialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: item, isLoading } = useMaterialItem(id!);
  const deleteMaterial = useDeleteMaterial();

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      'Delete Material?',
      `"${item.name}" and all usage logs will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMaterial.mutateAsync({
                id: id!,
                jobId: item.jobId,
              });
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete material.');
            }
          },
        },
      ],
    );
  };

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const onHand = item.purchasedQty - item.usedQty;
  const usagePercent =
    item.purchasedQty > 0
      ? Math.min(100, Math.round((item.usedQty / item.purchasedQty) * 100))
      : 0;
  const totalValue = item.purchasedQty * item.unitCost;
  const onHandRatio = item.purchasedQty > 0 ? onHand / item.purchasedQty : 1;
  const onHandColor =
    onHandRatio > 0.5
      ? colors.success
      : onHandRatio > 0.2
      ? colors.warning
      : colors.error;

  return (
    <Screen padded={false}>
      <Header
        title="Material Details"
        showBack
        rightAction={{
          icon: 'create-outline',
          onPress: () => router.push(`/material/edit/${id}`),
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{item.name}</Text>

        {/* Info Card */}
        <View style={styles.detailsCard}>
          {item.sku && (
            <View style={styles.detailRow}>
              <Ionicons
                name="barcode-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>SKU</Text>
              <Text style={styles.detailValue}>{item.sku}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons
              name="resize-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.detailLabel}>Unit</Text>
            <Text style={styles.detailValue}>{item.unit}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="cash-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.detailLabel}>Unit Cost</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.unitCost)}
            </Text>
          </View>
          {item.category && (
            <View style={styles.detailRow}>
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Category</Text>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text
                  style={[styles.categoryBadgeText, { color: colors.primary }]}
                >
                  {item.category}
                </Text>
              </View>
            </View>
          )}
          {item.job && (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => router.push(`/job/${item.job!.id}`)}
            >
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Job</Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                {item.job.name}
              </Text>
            </TouchableOpacity>
          )}
          {item.costCode && (
            <View style={styles.detailRow}>
              <Ionicons
                name="code-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Cost Code</Text>
              <Text style={styles.detailValue}>
                {item.costCode.code} - {item.costCode.name}
              </Text>
            </View>
          )}
        </View>

        {/* Inventory Card */}
        <View style={styles.inventoryCard}>
          <Text style={styles.inventoryTitle}>Inventory</Text>
          <View style={styles.inventoryGrid}>
            <View style={styles.inventoryItem}>
              <Text style={styles.inventoryValue}>{item.purchasedQty}</Text>
              <Text style={styles.inventoryLabel}>Purchased</Text>
            </View>
            <View style={styles.inventoryItem}>
              <Text style={styles.inventoryValue}>{item.usedQty}</Text>
              <Text style={styles.inventoryLabel}>Used</Text>
            </View>
            <View style={styles.inventoryItem}>
              <Text style={[styles.inventoryValue, { color: onHandColor }]}>
                {onHand}
              </Text>
              <Text style={styles.inventoryLabel}>On Hand</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Usage</Text>
              <Text style={[styles.progressPercent, { color: onHandColor }]}>
                {usagePercent}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${usagePercent}%`,
                    backgroundColor: onHandColor,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.totalValueRow}>
            <Text style={styles.totalValueLabel}>Total Value</Text>
            <Text style={styles.totalValueAmount}>
              {formatCurrency(totalValue)}
            </Text>
          </View>
        </View>

        {/* Log Usage Button */}
        <Button
          title="Log Usage"
          onPress={() =>
            router.push(
              `/material/log-usage?materialItemId=${id}&materialName=${encodeURIComponent(item.name)}`,
            )
          }
        />

        {/* Usage Logs */}
        <Text style={styles.sectionTitle}>
          Recent Usage Logs ({item.usageLogs?.length ?? 0})
        </Text>
        {item.usageLogs && item.usageLogs.length > 0 ? (
          <View style={styles.logsList}>
            {item.usageLogs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logInfo}>
                  <Text style={styles.logQty}>
                    {log.qty} {item.unit}
                  </Text>
                  <Text style={styles.logDate}>
                    {formatDate(log.loggedAt)} {log.loggedBy?.name ? `by ${log.loggedBy.name}` : ''}
                  </Text>
                  {log.notes && (
                    <Text style={styles.logNotes} numberOfLines={2}>
                      {log.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No usage logs yet</Text>
        )}

        {/* Delete */}
        <View style={styles.actions}>
          <Button
            title="Delete Material"
            onPress={handleDelete}
            variant="danger"
            loading={deleteMaterial.isPending}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textMuted,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    categoryBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    inventoryCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inventoryTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },
    inventoryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    inventoryItem: {
      alignItems: 'center',
    },
    inventoryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    inventoryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    progressSection: {
      marginBottom: spacing.md,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    progressLabel: {
      fontSize: 13,
      color: colors.textMuted,
    },
    progressPercent: {
      fontSize: 13,
      fontWeight: '700',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: borderRadius.full,
    },
    totalValueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalValueLabel: {
      fontSize: 14,
      color: colors.textMuted,
    },
    totalValueAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    logsList: {
      gap: spacing.sm,
    },
    logRow: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logInfo: {},
    logQty: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    logDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    logNotes: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    actions: {
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
