import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Card } from '../../src/components/ui';
import {
  useRecurringInvoice,
  useUpdateRecurringInvoice,
  useDeleteRecurringInvoice,
} from '../../src/hooks/useRecurringInvoices';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
};

export default function RecurringInvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: recurringInvoice, isLoading } = useRecurringInvoice(id ?? '');
  const updateMutation = useUpdateRecurringInvoice();
  const deleteMutation = useDeleteRecurringInvoice();

  const handleToggleActive = () => {
    if (!recurringInvoice) return;
    const newActive = !recurringInvoice.isActive;
    Alert.alert(
      newActive ? 'Activate' : 'Pause',
      `${newActive ? 'Resume' : 'Pause'} this recurring invoice?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newActive ? 'Activate' : 'Pause',
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({ id: id!, updates: { isActive: newActive } });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update');
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Delete this recurring invoice? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (isLoading || !recurringInvoice) {
    return (
      <Screen padded={false}>
        <Header title="Recurring Invoice" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const subtotal = (recurringInvoice.lineItems ?? []).reduce(
    (sum, li) => sum + Math.round(li.quantity * li.unitPrice),
    0,
  );
  const taxAmount = Math.round(subtotal * recurringInvoice.taxRate);
  const total = subtotal + taxAmount;

  return (
    <Screen padded={false}>
      <Header title="Recurring Invoice" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status card */}
        <Card>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: recurringInvoice.isActive
                    ? colors.success + '20'
                    : colors.textMuted + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: recurringInvoice.isActive
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              >
                {recurringInvoice.isActive ? 'Active' : 'Paused'}
              </Text>
            </View>
            <View style={styles.frequencyBadge}>
              <Ionicons name="repeat" size={14} color={colors.primary} />
              <Text style={styles.frequencyText}>
                {FREQUENCY_LABELS[recurringInvoice.frequency] || recurringInvoice.frequency}
              </Text>
            </View>
          </View>

          {recurringInvoice.job && (
            <Text style={styles.jobName}>{recurringInvoice.job.name}</Text>
          )}

          <View style={styles.dateGrid}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Next Invoice</Text>
              <Text style={styles.dateValue}>
                {new Date(recurringInvoice.nextOccurrence).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>
                {new Date(recurringInvoice.startDate).toLocaleDateString()}
              </Text>
            </View>
            {recurringInvoice.endDate && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>
                  {new Date(recurringInvoice.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {recurringInvoice.lastCreatedAt && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Last Created</Text>
                <Text style={styles.dateValue}>
                  {new Date(recurringInvoice.lastCreatedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Line Items */}
        <Text style={styles.sectionTitle}>Line Items</Text>
        <Card>
          {(recurringInvoice.lineItems ?? []).map((li, index) => (
            <View
              key={li.id}
              style={[styles.lineItemRow, index > 0 && styles.lineItemBorder]}
            >
              <View style={styles.lineItemInfo}>
                <Text style={styles.lineItemDesc}>{li.description}</Text>
                <Text style={styles.lineItemMeta}>
                  {li.quantity} x {formatMoney(li.unitPrice)}
                </Text>
              </View>
              <Text style={styles.lineItemTotal}>
                {formatMoney(Math.round(li.quantity * li.unitPrice))}
              </Text>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatMoney(subtotal)}</Text>
          </View>
          {recurringInvoice.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({(recurringInvoice.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.totalsValue}>{formatMoney(taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Total per Invoice</Text>
            <Text style={styles.totalsFinalValue}>{formatMoney(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {recurringInvoice.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Card>
              <Text style={styles.notesText}>{recurringInvoice.notes}</Text>
            </Card>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: recurringInvoice.isActive ? colors.warning : colors.success }]}
            onPress={handleToggleActive}
          >
            <Ionicons
              name={recurringInvoice.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={recurringInvoice.isActive ? colors.warning : colors.success}
            />
            <Text style={[styles.actionBtnText, { color: recurringInvoice.isActive ? colors.warning : colors.success }]}>
              {recurringInvoice.isActive ? 'Pause' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.primary }]}
            onPress={() => router.push(`/recurring-invoice/edit/${id}`)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.error }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    statusRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: { fontSize: 13, fontWeight: '600' },
    frequencyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary + '15',
    },
    frequencyText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    jobName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    dateGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    dateItem: { minWidth: '40%' },
    dateLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
    dateValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    lineItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    lineItemBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    lineItemInfo: { flex: 1 },
    lineItemDesc: { fontSize: 15, fontWeight: '500', color: colors.text },
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
      marginTop: spacing.md,
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
    totalsFinalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    totalsFinalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    notesText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    actionBtnText: { fontSize: 14, fontWeight: '600' },
  });
