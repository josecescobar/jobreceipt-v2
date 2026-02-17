import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button } from '../../src/components/ui';
import {
  ZoomableImage,
  ReceiptStatusBadge,
  JobSuggestionBanner,
  OcrFieldEditor,
  LineItemList,
  SplitAssignmentSheet,
} from '../../src/components/receipt';
import {
  useReceipt,
  useUpdateReceipt,
  useApproveReceipt,
  useRejectReceipt,
  useSplitReceipt,
} from '../../src/hooks/useReceipts';
import { useJobs } from '../../src/hooks/useJobs';
import { centsToDollars, dollarsToCents, formatDate } from '../../src/lib/format';
import { colors, spacing, typography } from '../../src/theme';

const IMAGE_HEIGHT = Dimensions.get('window').height * 0.4;

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: receipt, isLoading } = useReceipt(id ?? '');
  const updateReceipt = useUpdateReceipt();
  const approveReceipt = useApproveReceipt();
  const rejectReceipt = useRejectReceipt();
  const splitReceipt = useSplitReceipt();
  const { data: jobsData } = useJobs({ limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [showSplit, setShowSplit] = useState(false);
  const [editing, setEditing] = useState(false);

  // Editable fields (populated from receipt)
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [tax, setTax] = useState('');
  const [total, setTotal] = useState('');

  // Sync editable state when receipt loads
  React.useEffect(() => {
    if (receipt) {
      setMerchant(receipt.merchantName || '');
      setDate(receipt.transactionDate || '');
      setSubtotal(
        receipt.subtotal != null
          ? centsToDollars(receipt.subtotal).toString()
          : '',
      );
      setTax(
        receipt.taxAmount != null
          ? centsToDollars(receipt.taxAmount).toString()
          : '',
      );
      setTotal(
        receipt.totalAmount != null
          ? centsToDollars(receipt.totalAmount).toString()
          : '',
      );
    }
  }, [receipt]);

  if (!id || isLoading || !receipt) {
    return (
      <Screen padded={false}>
        <Header title="Receipt" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Receipt not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const suggestedJob = receipt.suggestedJobId
    ? jobs.find((j) => j.id === receipt.suggestedJobId)
    : null;

  const handleApprove = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await approveReceipt.mutateAsync(receipt.id);
    router.back();
  };

  const handleReject = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await rejectReceipt.mutateAsync(receipt.id);
    router.back();
  };

  const handleSaveEdits = async () => {
    await updateReceipt.mutateAsync({
      id: receipt.id,
      updates: {
        merchantName: merchant,
        transactionDate: date,
        subtotal: subtotal ? dollarsToCents(parseFloat(subtotal)) : undefined,
        taxAmount: tax ? dollarsToCents(parseFloat(tax)) : undefined,
        totalAmount: total ? dollarsToCents(parseFloat(total)) : undefined,
      },
    });
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAssignSuggested = async () => {
    if (!suggestedJob) return;
    await updateReceipt.mutateAsync({
      id: receipt.id,
      updates: { suggestedJobId: suggestedJob.id },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDismissSuggestion = async () => {
    await updateReceipt.mutateAsync({
      id: receipt.id,
      updates: { suggestedJobId: undefined },
    });
  };

  const displayLineItems = receipt.lineItems ?? [];

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title="Receipt"
        showBack
        rightAction={
          !editing
            ? { icon: 'create-outline', onPress: () => setEditing(true) }
            : { icon: 'checkmark', onPress: handleSaveEdits }
        }
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Receipt image */}
        {receipt.imageUrl && (
          <ZoomableImage uri={receipt.imageUrl} height={IMAGE_HEIGHT} />
        )}

        {/* Status */}
        <View style={styles.statusRow}>
          <ReceiptStatusBadge status={receipt.status} />
          {receipt.transactionDate && (
            <Text style={styles.dateText}>{formatDate(receipt.transactionDate)}</Text>
          )}
        </View>

        {/* AI Job suggestion */}
        {suggestedJob && receipt.status === 'REVIEW' && (
          <View style={styles.suggestionContainer}>
            <JobSuggestionBanner
              jobName={suggestedJob.name}
              confidence={receipt.confidenceScore ? parseFloat(receipt.confidenceScore) : undefined}
              onAssign={handleAssignSuggested}
              onDismiss={handleDismissSuggestion}
            />
          </View>
        )}

        {/* OCR Fields */}
        {editing ? (
          <OcrFieldEditor
            merchant={merchant}
            date={date}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onChangeMerchant={setMerchant}
            onChangeDate={setDate}
            onChangeSubtotal={setSubtotal}
            onChangeTax={setTax}
            onChangeTotal={setTotal}
          />
        ) : (
          <View style={styles.fieldsDisplay}>
            <Text style={styles.merchantName}>
              {receipt.merchantName || 'Unknown Merchant'}
            </Text>
            <View style={styles.amountRow}>
              {receipt.subtotal != null && (
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Subtotal</Text>
                  <Text style={styles.amountValue}>
                    ${centsToDollars(receipt.subtotal).toFixed(2)}
                  </Text>
                </View>
              )}
              {receipt.taxAmount != null && (
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Tax</Text>
                  <Text style={styles.amountValue}>
                    ${centsToDollars(receipt.taxAmount).toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${receipt.totalAmount != null ? centsToDollars(receipt.totalAmount).toFixed(2) : '—'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Line Items */}
        <LineItemList items={displayLineItems} />

        {/* Split button */}
        {displayLineItems.length > 1 && jobs.length > 0 && (
          <View style={styles.splitButtonContainer}>
            <Button
              title="Split by Job"
              onPress={() => setShowSplit(true)}
              variant="secondary"
            />
          </View>
        )}

        {/* Action buttons */}
        {receipt.status === 'REVIEW' && (
          <View style={styles.actions}>
            <Button
              title="Approve"
              onPress={handleApprove}
              variant="primary"
              style={styles.actionButton}
              loading={approveReceipt.isPending}
            />
            <Button
              title="Reject"
              onPress={handleReject}
              variant="danger"
              style={styles.actionButton}
              loading={rejectReceipt.isPending}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Split assignment sheet */}
      <SplitAssignmentSheet
        visible={showSplit}
        onClose={() => setShowSplit(false)}
        lineItems={displayLineItems}
        jobs={jobs}
        onSave={async (assignments) => {
          const dbLineItems = receipt.lineItems ?? [];
          const apiAssignments = assignments
            .filter((a) => dbLineItems[a.lineItemIndex])
            .map((a) => ({
              lineItemId: dbLineItems[a.lineItemIndex].id,
              jobId: a.jobId,
            }));

          if (apiAssignments.length > 0) {
            await splitReceipt.mutateAsync({
              id: receipt.id,
              assignments: { assignments: apiAssignments },
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          setShowSplit(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  suggestionContainer: {
    paddingHorizontal: spacing.lg,
  },
  fieldsDisplay: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  merchantName: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  amountItem: {},
  amountLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  splitButtonContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
