import React, { useMemo, useState } from 'react';
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
import { Button } from '../../src/components/ui';
import { useInvoice, useUpdateInvoice, useDeleteInvoice } from '../../src/hooks/useInvoices';
import { formatMoney } from '../../src/lib/format';
import { exportInvoicePdf } from '../../src/lib/export';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {};

function getStatusStyle(status: string, colors: ThemeColors) {
  if (status === 'PAID') return { bg: colors.success + '20', text: colors.success };
  if (status === 'SENT') return { bg: colors.primary + '20', text: colors.primary };
  return { bg: colors.warning + '20', text: colors.warning };
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: invoice, isLoading } = useInvoice(id ?? '');
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const [exporting, setExporting] = useState(false);

  const handleSharePdf = async () => {
    if (!invoice) return;
    setExporting(true);
    try {
      await exportInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleMarkSent = () => {
    Alert.alert('Mark as Sent', 'Update this invoice status to Sent?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Sent',
        onPress: async () => {
          try {
            await updateInvoice.mutateAsync({ id: id!, updates: { status: 'SENT' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update');
          }
        },
      },
    ]);
  };

  const handleMarkPaid = () => {
    Alert.alert('Mark as Paid', 'Update this invoice status to Paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: async () => {
          try {
            await updateInvoice.mutateAsync({ id: id!, updates: { status: 'PAID' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Invoice', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInvoice.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !invoice) {
    return (
      <Screen padded={false}>
        <Header title="Invoice" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Invoice not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusStyle(invoice.status, colors);
  const lineItems = invoice.lineItems ?? [];

  return (
    <Screen padded={false}>
      <Header title={invoice.invoiceNumber} showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {invoice.status}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Issued:</Text>
            <Text style={styles.dateValue}>
              {new Date(invoice.issueDate).toLocaleDateString()}
            </Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Due:</Text>
              <Text style={styles.dateValue}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Customer info */}
        {invoice.job && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {invoice.job.customerName && (
              <Text style={styles.customerName}>{invoice.job.customerName}</Text>
            )}
            {invoice.job.customerAddress && (
              <Text style={styles.customerAddress}>{invoice.job.customerAddress}</Text>
            )}
            <Text style={styles.jobName}>Job: {invoice.job.name}</Text>
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
                </Text>
              </View>
              <Text style={styles.lineItemTotal}>{formatMoney(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatMoney(invoice.subtotal)}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({(invoice.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.totalsValue}>{formatMoney(invoice.taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>{formatMoney(invoice.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={exporting ? 'Generating PDF...' : 'Share PDF'}
            onPress={handleSharePdf}
            loading={exporting}
          />

          {invoice.status === 'DRAFT' && (
            <>
              <Button
                title="Mark as Sent"
                onPress={handleMarkSent}
                variant="secondary"
                loading={updateInvoice.isPending}
                style={styles.actionBtn}
              />
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/invoice/edit/${id}`)}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={styles.editBtnText}>Edit Invoice</Text>
              </TouchableOpacity>
            </>
          )}

          {invoice.status === 'SENT' && (
            <Button
              title="Mark as Paid"
              onPress={handleMarkPaid}
              variant="secondary"
              loading={updateInvoice.isPending}
              style={styles.actionBtn}
            />
          )}

          {invoice.status === 'DRAFT' && (
            <Button
              title="Delete Invoice"
              onPress={handleDelete}
              variant="danger"
              loading={deleteInvoice.isPending}
              style={styles.actionBtn}
            />
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
      marginBottom: spacing.sm,
    },
    invoiceNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    dateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
    dateLabel: { fontSize: 13, color: colors.textMuted },
    dateValue: { fontSize: 13, color: colors.text, fontWeight: '500' },
    section: { marginBottom: spacing.lg },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    customerName: { fontSize: 16, fontWeight: '600', color: colors.text },
    customerAddress: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    jobName: { fontSize: 14, color: colors.primary, fontWeight: '500', marginTop: 4 },
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
    notesText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    actions: { marginTop: spacing.sm },
    actionBtn: { marginTop: spacing.sm },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    editBtnText: { fontSize: 14, fontWeight: '500', color: colors.primary },
  });
