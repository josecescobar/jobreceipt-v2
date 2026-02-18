import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button } from '../../src/components/ui';
import {
  useChangeOrder,
  useUpdateChangeOrder,
  useDeleteChangeOrder,
  useApproveChangeOrder,
  useRejectChangeOrder,
} from '../../src/hooks/useChangeOrders';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

function getStatusStyle(status: string, colors: ThemeColors) {
  if (status === 'APPROVED') return { bg: colors.success + '20', text: colors.success };
  if (status === 'SUBMITTED') return { bg: colors.warning + '20', text: colors.warning };
  if (status === 'REJECTED') return { bg: colors.error + '20', text: colors.error };
  return { bg: colors.textMuted + '20', text: colors.textMuted };
}

export default function ChangeOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: changeOrder, isLoading } = useChangeOrder(id ?? '');
  const updateChangeOrder = useUpdateChangeOrder();
  const deleteChangeOrder = useDeleteChangeOrder();
  const approveChangeOrder = useApproveChangeOrder();
  const rejectChangeOrder = useRejectChangeOrder();

  const handleSubmitForApproval = () => {
    Alert.alert('Submit for Approval', 'Submit this change order for approval?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            await updateChangeOrder.mutateAsync({ id: id!, updates: { status: 'SUBMITTED' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to submit');
          }
        },
      },
    ]);
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Change Order',
      'This will adjust the job budget. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveChangeOrder.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to approve');
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert('Reject Change Order', 'Reject this change order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectChangeOrder.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Change Order', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChangeOrder.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !changeOrder) {
    return (
      <Screen padded={false}>
        <Header title="Change Order" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Change order not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusStyle(changeOrder.status, colors);
  const lineItems = changeOrder.lineItems ?? [];

  return (
    <Screen padded={false}>
      <Header title={changeOrder.changeOrderNumber} showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.coNumber}>{changeOrder.changeOrderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {changeOrder.status}
              </Text>
            </View>
          </View>
          <Text style={styles.coTitle}>{changeOrder.title}</Text>
          {changeOrder.job && (
            <Text style={styles.jobName}>Job: {changeOrder.job.name}</Text>
          )}
        </View>

        {/* Description */}
        {changeOrder.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.bodyText}>{changeOrder.description}</Text>
          </View>
        )}

        {/* Reason */}
        {changeOrder.reason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason</Text>
            <Text style={styles.bodyText}>{changeOrder.reason}</Text>
          </View>
        )}

        {/* Line items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {lineItems.map((item) => (
            <View key={item.id} style={styles.lineItemRow}>
              <View style={styles.lineItemInfo}>
                <Text style={styles.lineItemDesc}>{item.description}</Text>
                <Text style={styles.lineItemMeta}>
                  {item.quantity} x {formatMoney(item.unitPrice)}
                  {(item as any).costCode ? ` | ${(item as any).costCode.code}` : ''}
                </Text>
              </View>
              <Text
                style={[
                  styles.lineItemTotal,
                  item.total < 0 && { color: colors.error },
                ]}
              >
                {formatMoney(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatMoney(changeOrder.subtotal)}</Text>
          </View>
          {changeOrder.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({(changeOrder.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.totalsValue}>{formatMoney(changeOrder.taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Total Change</Text>
            <Text
              style={[
                styles.totalsFinalValue,
                changeOrder.total < 0 && { color: colors.error },
              ]}
            >
              {formatMoney(changeOrder.total)}
            </Text>
          </View>
        </View>

        {/* Approval info */}
        {(changeOrder.status === 'APPROVED' || changeOrder.status === 'REJECTED') && (
          <View style={styles.approvalCard}>
            <Text style={styles.approvalTitle}>
              {changeOrder.status === 'APPROVED' ? 'Approved' : 'Rejected'} by{' '}
              {(changeOrder as any).approvedBy?.name ?? 'Unknown'}
            </Text>
            {changeOrder.approvedAt && (
              <Text style={styles.approvalDate}>
                {new Date(changeOrder.approvedAt).toLocaleDateString()}
              </Text>
            )}
            {changeOrder.status === 'APPROVED' && (
              <Text style={styles.approvalNote}>Applied to job budget</Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {changeOrder.status === 'DRAFT' && (
            <>
              <Button
                title="Submit for Approval"
                onPress={handleSubmitForApproval}
                loading={updateChangeOrder.isPending}
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="danger"
                loading={deleteChangeOrder.isPending}
                style={styles.actionBtn}
              />
            </>
          )}

          {changeOrder.status === 'SUBMITTED' && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingText}>Awaiting Approval</Text>
              <View style={styles.approvalButtons}>
                <Button
                  title="Approve"
                  onPress={handleApprove}
                  loading={approveChangeOrder.isPending}
                  style={styles.approvalBtn}
                />
                <Button
                  title="Reject"
                  onPress={handleReject}
                  variant="danger"
                  loading={rejectChangeOrder.isPending}
                  style={styles.approvalBtn}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    coNumber: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
    coTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    jobName: { fontSize: 14, color: colors.primary, fontWeight: '500' },
    section: { marginBottom: spacing.lg },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    bodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    lineItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lineItemInfo: { flex: 1 },
    lineItemDesc: { fontSize: 15, color: colors.text, fontWeight: '500' },
    lineItemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    lineItemTotal: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    totalsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
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
    totalsValue: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
    totalsFinal: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
    },
    totalsFinalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
    totalsFinalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    approvalCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    approvalTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    approvalDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    approvalNote: {
      fontSize: 13,
      color: colors.success,
      fontWeight: '500',
      marginTop: 4,
    },
    actions: { marginTop: spacing.sm },
    actionBtn: { marginTop: spacing.sm },
    pendingBox: { alignItems: 'center' },
    pendingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.warning,
      marginBottom: spacing.md,
    },
    approvalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
    },
    approvalBtn: { flex: 1 },
  });
