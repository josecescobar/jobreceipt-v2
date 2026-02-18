import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button } from '../../src/components/ui';
import {
  useEstimate,
  useUpdateEstimate,
  useDeleteEstimate,
  useConvertEstimateToInvoice,
  useGenerateEstimateShareLink,
} from '../../src/hooks/useEstimates';
import { formatMoney } from '../../src/lib/format';
import { exportEstimatePdf } from '../../src/lib/export';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

function getStatusStyle(status: string, colors: ThemeColors) {
  if (status === 'ACCEPTED') return { bg: colors.success + '20', text: colors.success };
  if (status === 'SENT') return { bg: colors.primary + '20', text: colors.primary };
  if (status === 'REJECTED') return { bg: colors.error + '20', text: colors.error };
  if (status === 'EXPIRED') return { bg: colors.warning + '20', text: colors.warning };
  if (status === 'CONVERTED') return { bg: colors.success + '20', text: colors.success };
  return { bg: colors.textMuted + '20', text: colors.textMuted };
}

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: estimate, isLoading } = useEstimate(id ?? '');
  const updateEstimate = useUpdateEstimate();
  const deleteEstimate = useDeleteEstimate();
  const convertToInvoice = useConvertEstimateToInvoice();
  const generateShareLink = useGenerateEstimateShareLink();
  const [exporting, setExporting] = useState(false);

  const handleShareLink = async () => {
    try {
      const { url } = await generateShareLink.mutateAsync(id!);
      await Share.share({ message: `View estimate: ${url}`, url });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to generate share link');
    }
  };

  const handleSharePdf = async () => {
    if (!estimate) return;
    setExporting(true);
    try {
      await exportEstimatePdf(estimate.id, estimate.estimateNumber);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleMarkSent = () => {
    Alert.alert('Mark as Sent', 'Update this estimate status to Sent?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Sent',
        onPress: async () => {
          try {
            await updateEstimate.mutateAsync({ id: id!, updates: { status: 'SENT' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update');
          }
        },
      },
    ]);
  };

  const handleMarkAccepted = () => {
    Alert.alert('Mark as Accepted', 'Update this estimate status to Accepted?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await updateEstimate.mutateAsync({ id: id!, updates: { status: 'ACCEPTED' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update');
          }
        },
      },
    ]);
  };

  const handleMarkRejected = () => {
    Alert.alert('Mark as Rejected', 'Update this estimate status to Rejected?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateEstimate.mutateAsync({ id: id!, updates: { status: 'REJECTED' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update');
          }
        },
      },
    ]);
  };

  const handleConvertToInvoice = () => {
    Alert.alert(
      'Convert to Invoice',
      'This will create an invoice from this estimate. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: async () => {
            try {
              const invoice = await convertToInvoice.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace(`/invoice/${invoice.id}`);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to convert');
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete Estimate', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEstimate.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !estimate) {
    return (
      <Screen padded={false}>
        <Header title="Estimate" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Estimate not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusStyle(estimate.status, colors);
  const lineItems = estimate.lineItems ?? [];

  return (
    <Screen padded={false}>
      <Header title={estimate.estimateNumber} showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.estimateNumber}>{estimate.estimateNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {estimate.status}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Issued:</Text>
            <Text style={styles.dateValue}>
              {new Date(estimate.issueDate).toLocaleDateString()}
            </Text>
          </View>
          {estimate.expiresAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Expires:</Text>
              <Text style={styles.dateValue}>
                {new Date(estimate.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Customer info */}
        {estimate.job && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prepared For</Text>
            {estimate.job.customerName && (
              <Text style={styles.customerName}>{estimate.job.customerName}</Text>
            )}
            {estimate.job.customerAddress && (
              <Text style={styles.customerAddress}>{estimate.job.customerAddress}</Text>
            )}
            <Text style={styles.jobName}>Job: {estimate.job.name}</Text>
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
            <Text style={styles.totalsValue}>{formatMoney(estimate.subtotal)}</Text>
          </View>
          {estimate.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({(estimate.taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.totalsValue}>{formatMoney(estimate.taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>{formatMoney(estimate.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {estimate.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{estimate.notes}</Text>
          </View>
        )}

        {/* Converted invoice link */}
        {estimate.status === 'CONVERTED' && estimate.convertedInvoiceId && (
          <TouchableOpacity
            style={styles.convertedLink}
            onPress={() => router.push(`/invoice/${estimate.convertedInvoiceId}`)}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.convertedLinkText}>View Converted Invoice</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={exporting ? 'Generating PDF...' : 'Share PDF'}
            onPress={handleSharePdf}
            loading={exporting}
          />

          <Button
            title="Share Customer Link"
            onPress={handleShareLink}
            variant="secondary"
            loading={generateShareLink.isPending}
            style={styles.actionBtn}
          />

          {estimate.status === 'DRAFT' && (
            <>
              <Button
                title="Mark as Sent"
                onPress={handleMarkSent}
                variant="secondary"
                loading={updateEstimate.isPending}
                style={styles.actionBtn}
              />
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/estimate/edit/${id}`)}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={styles.editBtnText}>Edit Estimate</Text>
              </TouchableOpacity>
              <Button
                title="Delete Estimate"
                onPress={handleDelete}
                variant="danger"
                loading={deleteEstimate.isPending}
                style={styles.actionBtn}
              />
            </>
          )}

          {estimate.status === 'SENT' && (
            <>
              <Button
                title="Mark as Accepted"
                onPress={handleMarkAccepted}
                variant="secondary"
                loading={updateEstimate.isPending}
                style={styles.actionBtn}
              />
              <Button
                title="Mark as Rejected"
                onPress={handleMarkRejected}
                variant="danger"
                loading={updateEstimate.isPending}
                style={styles.actionBtn}
              />
            </>
          )}

          {estimate.status === 'ACCEPTED' && (
            <Button
              title="Convert to Invoice"
              onPress={handleConvertToInvoice}
              variant="secondary"
              loading={convertToInvoice.isPending}
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
    estimateNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
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
    convertedLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    convertedLinkText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
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
