import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Badge } from '../../../src/components/ui';
import {
  useDrawRequest,
  useSubmitDrawRequest,
  useApproveDrawRequest,
} from '../../../src/hooks/useProgressBilling';
import { formatMoney, formatDate } from '../../../src/lib/format';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../../src/theme';

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

export default function DrawRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: dr, isLoading } = useDrawRequest(id!);
  const submitDrawRequest = useSubmitDrawRequest();
  const approveDrawRequest = useApproveDrawRequest();

  if (isLoading || !dr) {
    return (
      <Screen padded={false}>
        <Header title="Draw Request" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusStyle(dr.status, colors);
  const entries = dr.entries ?? [];

  const handleSubmit = () => {
    Alert.alert(
      'Submit Draw Request?',
      'This will submit the draw request for approval. You cannot edit it after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await submitDrawRequest.mutateAsync(dr.id);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message ||
                  'Failed to submit draw request',
              );
            }
          },
        },
      ],
    );
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Draw Request?',
      'This will approve the draw request and auto-generate an invoice.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveDrawRequest.mutateAsync(dr.id);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message ||
                  'Failed to approve draw request',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false}>
      <Header
        title={`Draw Request #${dr.applicationNumber}`}
        showBack
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Badge
              label={statusStyle.label}
              color={statusStyle.text}
              backgroundColor={statusStyle.bg}
            />
            <Text style={styles.periodText}>
              Period to: {formatDate(dr.periodTo)}
            </Text>
          </View>
          {dr.schedule?.job && (
            <Text style={styles.jobName}>{dr.schedule.job.name}</Text>
          )}
          {dr.createdBy && (
            <Text style={styles.createdByText}>
              Created by {dr.createdBy.name}
            </Text>
          )}
          {dr.approvedBy && (
            <Text style={styles.approvedByText}>
              Approved by {dr.approvedBy.name}
              {dr.approvedAt ? ` on ${formatDate(dr.approvedAt)}` : ''}
            </Text>
          )}
        </View>

        {/* Entries Table */}
        <Text style={styles.sectionTitle}>
          Entries ({entries.length})
        </Text>

        {entries.map((entry) => {
          const sovItem = entry.sovItem;
          return (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.itemNumberBadge}>
                  <Text style={styles.itemNumberText}>
                    #{sovItem?.itemNumber ?? '?'}
                  </Text>
                </View>
                <Text style={styles.entryDescription} numberOfLines={1}>
                  {sovItem?.description ?? 'Unknown Item'}
                </Text>
              </View>

              <View style={styles.entryGrid}>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>Scheduled</Text>
                  <Text style={styles.entryGridValue}>
                    {formatMoney(sovItem?.scheduledValue ?? 0)}
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>Previous</Text>
                  <Text style={styles.entryGridValue}>
                    {formatMoney(entry.workCompletedPrevious)}
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>This Period</Text>
                  <Text
                    style={[styles.entryGridValue, { color: colors.primary }]}
                  >
                    {formatMoney(entry.workCompletedThisPeriod)}
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>Materials</Text>
                  <Text style={styles.entryGridValue}>
                    {formatMoney(entry.materialsStored)}
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>Total</Text>
                  <Text style={styles.entryGridValue}>
                    {formatMoney(entry.totalCompletedAndStored)}
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>%</Text>
                  <Text style={styles.entryGridValue}>
                    {entry.percentComplete.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>Balance</Text>
                  <Text style={styles.entryGridValue}>
                    {formatMoney(entry.balanceToFinish)}
                  </Text>
                </View>
                <View style={styles.entryGridItem}>
                  <Text style={styles.entryGridLabel}>Retainage</Text>
                  <Text
                    style={[styles.entryGridValue, { color: colors.warning }]}
                  >
                    {formatMoney(entry.retainage)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Earned</Text>
            <Text style={styles.totalsValue}>
              {formatMoney(dr.totalEarned)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Retainage</Text>
            <Text style={[styles.totalsValue, { color: colors.warning }]}>
              -{formatMoney(dr.totalRetainage)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Previously Billed</Text>
            <Text style={styles.totalsValue}>
              -{formatMoney(dr.totalPreviouslyBilled)}
            </Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Current Payment Due</Text>
            <Text style={styles.totalsFinalValue}>
              {formatMoney(dr.currentPaymentDue)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {dr.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{dr.notes}</Text>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {dr.status === 'DRAFT' && (
            <Button
              title="Submit for Approval"
              onPress={handleSubmit}
              loading={submitDrawRequest.isPending}
            />
          )}

          {dr.status === 'SUBMITTED' && (
            <Button
              title="Approve"
              onPress={handleApprove}
              loading={approveDrawRequest.isPending}
            />
          )}

          {dr.status === 'APPROVED' && dr.invoiceId && (
            <Button
              title="View Invoice"
              onPress={() => router.push(`/invoice/${dr.invoiceId}`)}
              variant="secondary"
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    periodText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    jobName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    createdByText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    approvedByText: {
      fontSize: 12,
      color: colors.success,
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
    entryCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
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
    entryDescription: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    entryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    entryGridItem: {
      width: '23%',
      minWidth: 70,
    },
    entryGridLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: 1,
    },
    entryGridValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    totalsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    totalsLabel: { fontSize: 14, color: colors.textSecondary },
    totalsValue: {
      fontSize: 14,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    totalsFinal: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
    },
    totalsFinalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    totalsFinalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    notesText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    actionContainer: {
      gap: spacing.md,
      marginTop: spacing.md,
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
