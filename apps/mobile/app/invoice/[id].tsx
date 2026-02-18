import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useInvoice, useUpdateInvoice, useDeleteInvoice, useAddPayment, useRemovePayment } from '../../src/hooks/useInvoices';
import { formatMoney, dollarsToCents, centsToDollars } from '../../src/lib/format';
import { exportInvoicePdf } from '../../src/lib/export';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {};

const PAYMENT_METHODS = ['CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'] as const;
const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CHECK: 'Check',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  OTHER: 'Other',
};

function getStatusStyle(status: string, colors: ThemeColors) {
  if (status === 'PAID') return { bg: colors.success + '20', text: colors.success };
  if (status === 'SENT') return { bg: colors.primary + '20', text: colors.primary };
  if (status === 'PARTIALLY_PAID') return { bg: colors.warning + '20', text: colors.warning };
  return { bg: colors.textMuted + '20', text: colors.textMuted };
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: invoice, isLoading } = useInvoice(id ?? '');
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();
  const removePayment = useRemovePayment();
  const [exporting, setExporting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>('CHECK');
  const [paymentNote, setPaymentNote] = useState('');

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

  const openPaymentModal = () => {
    if (invoice) {
      const remaining = invoice.total - (invoice.paidAmount ?? 0);
      setPaymentAmount(String(centsToDollars(remaining)));
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CHECK');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    const amountCents = dollarsToCents(parseFloat(paymentAmount) || 0);
    if (amountCents <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a payment amount greater than zero.');
      return;
    }
    try {
      await addPayment.mutateAsync({
        invoiceId: id!,
        payment: {
          amount: amountCents,
          date: paymentDate,
          method: paymentMethod,
          note: paymentNote || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPaymentModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleRemovePayment = (paymentId: string, amount: number) => {
    Alert.alert('Remove Payment', `Remove payment of ${formatMoney(amount)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePayment.mutateAsync({ invoiceId: id!, paymentId });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove payment');
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

        {/* Payments & Balance */}
        {(invoice.paidAmount ?? 0) > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.sectionTitle}>Payments</Text>
            {(invoice as any).payments?.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={styles.paymentRow}
                onLongPress={() => handleRemovePayment(p.id, p.amount)}
              >
                <View>
                  <Text style={styles.paymentMethod}>{METHOD_LABELS[p.method] || p.method}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(p.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>{formatMoney(p.amount)}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.totalsRow, styles.balanceRow]}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text style={styles.balanceValue}>
                {formatMoney(invoice.total - (invoice.paidAmount ?? 0))}
              </Text>
            </View>
          </View>
        )}

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

          {(invoice.status === 'SENT' || invoice.status === 'PARTIALLY_PAID') && (
            <Button
              title="Record Payment"
              onPress={openPaymentModal}
              variant="secondary"
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

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Amount ($)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <DatePickerField
              label="Payment Date"
              value={paymentDate}
              onChange={setPaymentDate}
            />

            <Text style={styles.methodLabel}>Payment Method</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.methodScroll}
            >
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodChip,
                    paymentMethod === method && styles.methodChipActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodChipText,
                      paymentMethod === method && styles.methodChipTextActive,
                    ]}
                  >
                    {METHOD_LABELS[method]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              label="Note (optional)"
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="Check #1234, etc."
            />

            <Button
              title="Record Payment"
              onPress={handleRecordPayment}
              loading={addPayment.isPending}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paymentsSection: { marginBottom: spacing.lg },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    paymentMethod: { fontSize: 14, fontWeight: '500', color: colors.text },
    paymentDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    paymentAmount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.success,
      fontVariant: ['tabular-nums'],
    },
    balanceRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
    },
    balanceLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    balanceValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.warning,
      fontVariant: ['tabular-nums'],
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    methodLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    methodScroll: { marginBottom: spacing.lg },
    methodChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    methodChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    methodChipText: { fontSize: 13, color: colors.textSecondary },
    methodChipTextActive: { color: colors.white },
  });
