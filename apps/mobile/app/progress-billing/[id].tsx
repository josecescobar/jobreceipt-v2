import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB } from '../../src/components/ui';
import { useSOV, useSOVSummary } from '../../src/hooks/useProgressBilling';
import { formatMoney, formatDate } from '../../src/lib/format';
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

export default function SOVDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: sov, isLoading } = useSOV(id!);
  const { data: summary } = useSOVSummary(id!);

  if (isLoading || !sov) {
    return (
      <Screen padded={false}>
        <Header title="Schedule of Values" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const items = sov.items ?? [];
  const drawRequests = sov.drawRequests ?? [];

  return (
    <Screen padded={false}>
      <Header title={sov.job?.name ?? 'Schedule of Values'} showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Progress Summary</Text>

            {/* Percent Complete Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(summary.percentComplete, 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.percentText}>
                {summary.percentComplete.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Scheduled Value</Text>
                <Text style={styles.summaryValue}>
                  {formatMoney(summary.totalScheduledValue)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Earned</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatMoney(summary.totalEarned)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Retainage</Text>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>
                  {formatMoney(summary.totalRetainage)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={styles.summaryValue}>
                  {formatMoney(summary.remainingValue)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SOV Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Retainage</Text>
          <Text style={styles.infoValue}>{sov.retainagePercent}%</Text>
        </View>

        {/* Items Section */}
        <Text style={styles.sectionTitle}>
          Line Items ({items.length})
        </Text>
        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <View style={styles.itemNumberBadge}>
                <Text style={styles.itemNumberText}>#{item.itemNumber}</Text>
              </View>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <Text style={styles.itemValue}>
              {formatMoney(item.scheduledValue)}
            </Text>
          </View>
        ))}

        {/* Draw Requests Section */}
        <View style={styles.drawRequestHeader}>
          <Text style={styles.sectionTitle}>
            Draw Requests ({drawRequests.length})
          </Text>
        </View>

        {drawRequests.length > 0 ? (
          drawRequests.map((dr) => {
            const statusStyle = getStatusStyle(dr.status, colors);
            return (
              <TouchableOpacity
                key={dr.id}
                style={styles.drawRequestCard}
                onPress={() =>
                  router.push(`/progress-billing/draw-request/${dr.id}`)
                }
                activeOpacity={0.7}
              >
                <View style={styles.drawRequestRow}>
                  <View style={styles.drawRequestInfo}>
                    <Text style={styles.drawRequestNumber}>
                      Application #{dr.applicationNumber}
                    </Text>
                    <Text style={styles.drawRequestDate}>
                      Period to: {formatDate(dr.periodTo)}
                    </Text>
                  </View>
                  <View style={styles.drawRequestRight}>
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
                    <Text style={styles.drawRequestAmount}>
                      {formatMoney(dr.currentPaymentDue)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            No draw requests yet -- tap + to create one.
          </Text>
        )}

        {/* Notes */}
        {sov.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{sov.notes}</Text>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        onPress={() =>
          router.push(
            `/progress-billing/draw-request/create?scheduleId=${sov.id}`,
          )
        }
        icon="add"
        label="New Draw Request"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    progressBarTrack: {
      flex: 1,
      height: 10,
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: 10,
      borderRadius: borderRadius.full,
    },
    percentText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
      width: 50,
      textAlign: 'right',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    summaryItem: {
      width: '47%',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    itemCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    itemNumberBadge: {
      backgroundColor: colors.primary + '15',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginRight: spacing.sm,
    },
    itemNumberText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    itemDescription: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    itemValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      textAlign: 'right',
    },
    drawRequestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    drawRequestCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    drawRequestRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    drawRequestInfo: {
      flex: 1,
      gap: 2,
    },
    drawRequestNumber: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    drawRequestDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
    drawRequestRight: {
      alignItems: 'flex-end',
      gap: 4,
      marginLeft: spacing.md,
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
    drawRequestAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    notesText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
