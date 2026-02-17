import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Card } from '../../src/components/ui';
import {
  ZoomableImage,
  ReceiptStatusBadge,
  JobSuggestionBanner,
  OcrFieldEditor,
  LineItemList,
  SplitAssignmentSheet,
  CreateExpenseFromReceiptSheet,
} from '../../src/components/receipt';
import {
  useReceipt,
  useUpdateReceipt,
  useApproveReceipt,
  useRejectReceipt,
  useSplitReceipt,
  useDeleteReceipt,
} from '../../src/hooks/useReceipts';
import { useCreateExpense } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { centsToDollars, dollarsToCents, formatDate, formatMoney } from '../../src/lib/format';
import { colors, spacing, typography, borderRadius } from '../../src/theme';

const IMAGE_HEIGHT = Dimensions.get('window').height * 0.4;

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: receipt, isLoading } = useReceipt(id ?? '', {
    refetchInterval: (query) =>
      query.state.data?.status === 'PROCESSING' ? 3000 : false,
  });
  const updateReceipt = useUpdateReceipt();
  const approveReceipt = useApproveReceipt();
  const rejectReceipt = useRejectReceipt();
  const splitReceipt = useSplitReceipt();
  const deleteReceipt = useDeleteReceipt();
  const { data: jobsData } = useJobs({ limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const createExpense = useCreateExpense();

  const [showSplit, setShowSplit] = useState(false);
  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

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
      setDate(receipt.transactionDate ? receipt.transactionDate.toString().split('T')[0] : '');
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

  const isProcessing = receipt.status === 'PROCESSING';
  const suggestedJob = receipt.suggestedJobId
    ? jobs.find((j) => j.id === receipt.suggestedJobId)
    : null;

  const handleApprove = () => {
    setShowExpenseSheet(true);
  };

  const handleCreateExpenseAndApprove = async (data: {
    jobId: string;
    amount: number;
    description: string;
    category?: string;
    date: string;
    receiptId: string;
  }) => {
    setError('');
    try {
      await createExpense.mutateAsync(data);
      await approveReceipt.mutateAsync(receipt.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowExpenseSheet(false);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense and approve');
    }
  };

  const handleJustApprove = async () => {
    setError('');
    try {
      await approveReceipt.mutateAsync(receipt.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowExpenseSheet(false);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve receipt');
    }
  };

  const handleReject = async () => {
    setError('');
    try {
      await rejectReceipt.mutateAsync(receipt.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject receipt');
    }
  };

  const handleSaveEdits = async () => {
    setError('');
    try {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    }
  };

  const handleAssignSuggested = async () => {
    if (!suggestedJob) return;
    setError('');
    try {
      await updateReceipt.mutateAsync({
        id: receipt.id,
        updates: { suggestedJobId: suggestedJob.id },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign job');
    }
  };

  const handleDismissSuggestion = async () => {
    try {
      await updateReceipt.mutateAsync({
        id: receipt.id,
        updates: { suggestedJobId: undefined },
      });
    } catch {
      // Silent dismiss failure
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Receipt', 'Are you sure you want to delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReceipt.mutateAsync(receipt.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete receipt');
          }
        },
      },
    ]);
  };

  const displayLineItems = receipt.lineItems ?? [];

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title="Receipt"
        showBack
        rightAction={
          !isProcessing
            ? !editing
              ? { icon: 'create-outline', onPress: () => setEditing(true) }
              : { icon: 'checkmark', onPress: handleSaveEdits }
            : undefined
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
            <Text style={styles.dateText}>{formatDate(receipt.transactionDate.toString())}</Text>
          )}
        </View>

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingCard}>
            <ActivityIndicator color={colors.warning} size="small" />
            <Text style={styles.processingText}>
              Processing receipt...
            </Text>
            <Text style={styles.processingSubtext}>
              OCR is extracting data from your receipt. This usually takes a few seconds.
            </Text>
          </View>
        )}

        {/* AI Job suggestion */}
        {suggestedJob && receipt.status === 'REVIEW' && (
          <View style={styles.suggestionContainer}>
            <JobSuggestionBanner
              jobName={suggestedJob.name}
              confidence={receipt.confidenceScore || undefined}
              onAssign={handleAssignSuggested}
              onDismiss={handleDismissSuggestion}
            />
          </View>
        )}

        {/* OCR Fields */}
        {!isProcessing && (
          <>
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
                {receipt.merchantAddress && (
                  <Text style={styles.merchantAddress}>
                    {receipt.merchantAddress}
                  </Text>
                )}
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

            {/* Linked Expenses */}
            {receipt.expenses && receipt.expenses.length > 0 && (
              <View style={styles.linkedSection}>
                <Text style={styles.linkedTitle}>Linked Expenses</Text>
                {receipt.expenses.map((exp) => (
                  <TouchableOpacity
                    key={exp.id}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/expense/edit/${exp.id}`)}
                  >
                    <Card style={styles.linkedCard}>
                      <View style={styles.linkedRow}>
                        <View style={styles.linkedIcon}>
                          <Ionicons name="cash-outline" size={16} color={colors.success} />
                        </View>
                        <View style={styles.linkedInfo}>
                          <Text style={styles.linkedDesc} numberOfLines={1}>
                            {exp.description}
                          </Text>
                          {exp.job && (
                            <Text style={styles.linkedJob}>{exp.job.name}</Text>
                          )}
                        </View>
                        <Text style={styles.linkedAmount}>
                          {formatMoney(exp.amount)}
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Error display */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

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

        {/* Delete button */}
        <View style={styles.deleteContainer}>
          <Button
            title="Delete Receipt"
            onPress={handleDelete}
            variant="danger"
            loading={deleteReceipt.isPending}
          />
        </View>

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

      {/* Create expense from receipt sheet */}
      <CreateExpenseFromReceiptSheet
        visible={showExpenseSheet}
        onClose={() => setShowExpenseSheet(false)}
        receipt={receipt}
        jobs={jobs}
        onCreateAndApprove={handleCreateExpenseAndApprove}
        onJustApprove={handleJustApprove}
        loading={createExpense.isPending || approveReceipt.isPending}
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
  processingCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
    gap: spacing.sm,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
  },
  processingSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
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
    marginBottom: spacing.xs,
  },
  merchantAddress: {
    fontSize: 14,
    color: colors.textSecondary,
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
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
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
  linkedSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  linkedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  linkedCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  linkedInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  linkedDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  linkedJob: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  linkedAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  deleteContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
