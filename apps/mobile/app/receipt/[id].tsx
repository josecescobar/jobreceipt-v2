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
  DuplicateWarningBanner,
  OcrFieldEditor,
  LineItemList,
  SplitAssignmentSheet,
  CreateExpenseFromReceiptSheet,
  FullScreenImageViewer,
} from '../../src/components/receipt';
import {
  useReceipt,
  useUpdateReceipt,
  useApproveReceipt,
  useRejectReceipt,
  useSplitReceipt,
  useDeleteReceipt,
  useCreateLineItem,
  useUpdateLineItem,
  useDeleteLineItem,
} from '../../src/hooks/useReceipts';
import { useCreateExpense, useCreateExpenseBatch } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { centsToDollars, dollarsToCents, formatDate, formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius } from '../../src/theme';

const IMAGE_HEIGHT = Dimensions.get('window').height * 0.4;

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const { data: receipt, isLoading } = useReceipt(id ?? '', {
    refetchInterval: (query) =>
      query.state.data?.status === 'PROCESSING' ? 3000 : false,
  });
  const updateReceipt = useUpdateReceipt();
  const approveReceipt = useApproveReceipt();
  const rejectReceipt = useRejectReceipt();
  const splitReceipt = useSplitReceipt();
  const deleteReceipt = useDeleteReceipt();
  const createLineItem = useCreateLineItem();
  const updateLineItem = useUpdateLineItem();
  const deleteLineItem = useDeleteLineItem();
  const { data: jobsData } = useJobs({ limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const createExpense = useCreateExpense();
  const createExpenseBatch = useCreateExpenseBatch();

  const [showSplit, setShowSplit] = useState(false);
  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  // Editable fields (populated from receipt)
  const [merchant, setMerchant] = useState('');
  const [merchantAddress, setMerchantAddress] = useState('');
  const [date, setDate] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [tax, setTax] = useState('');
  const [total, setTotal] = useState('');

  // Sync editable state when receipt loads
  React.useEffect(() => {
    if (receipt) {
      setMerchant(receipt.merchantName || '');
      setMerchantAddress(receipt.merchantAddress || '');
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

  const handleCreateSplitAndApprove = async (items: Array<{
    jobId: string;
    amount: number;
    description: string;
    category?: string;
    date: string;
    receiptId: string;
  }>) => {
    setError('');
    try {
      await createExpenseBatch.mutateAsync(items);
      await approveReceipt.mutateAsync(receipt.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowExpenseSheet(false);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create split expenses and approve');
    }
  };

  const canQuickApprove = !!(
    receipt.suggestedJobId &&
    receipt.totalAmount != null &&
    receipt.transactionDate
  );

  const handleQuickApprove = async () => {
    if (!canQuickApprove) return;
    setError('');
    try {
      await createExpense.mutateAsync({
        jobId: receipt.suggestedJobId!,
        amount: receipt.totalAmount!,
        description: `Receipt from ${receipt.merchantName || 'Unknown'}`,
        category: receipt.suggestedCategory || 'MATERIALS',
        date: receipt.transactionDate!.toString().split('T')[0],
        receiptId: receipt.id,
      });
      await approveReceipt.mutateAsync(receipt.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to quick approve');
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
          merchantAddress: merchantAddress,
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

  const handleUpdateLineItem = async (lineItemId: string, data: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => {
    setError('');
    try {
      await updateLineItem.mutateAsync({ receiptId: receipt.id, lineItemId, data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update line item');
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    Alert.alert('Delete Item', 'Remove this line item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLineItem.mutateAsync({ receiptId: receipt.id, lineItemId });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete line item');
          }
        },
      },
    ]);
  };

  const handleAddLineItem = async (data: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => {
    setError('');
    try {
      await createLineItem.mutateAsync({ receiptId: receipt.id, data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add line item');
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

  const handleDismissDuplicate = async () => {
    try {
      await updateReceipt.mutateAsync({
        id: receipt.id,
        updates: { duplicateOfId: null },
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setImageViewerVisible(true)}
          >
            <ZoomableImage uri={receipt.imageUrl} height={IMAGE_HEIGHT} />
            <View style={styles.expandHint}>
              <Ionicons name="expand-outline" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
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

        {/* Duplicate warning */}
        {receipt.duplicateOf && receipt.status === 'REVIEW' && (
          <View style={styles.suggestionContainer}>
            <DuplicateWarningBanner
              duplicateOf={receipt.duplicateOf}
              onDismiss={handleDismissDuplicate}
            />
          </View>
        )}

        {/* AI Job suggestion */}
        {suggestedJob && receipt.status === 'REVIEW' && (
          <View style={styles.suggestionContainer}>
            <JobSuggestionBanner
              jobName={suggestedJob.name}
              confidence={receipt.confidenceScore || undefined}
              suggestedCategory={receipt.suggestedCategory}
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
                merchantAddress={merchantAddress}
                date={date}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onChangeMerchant={setMerchant}
                onChangeMerchantAddress={setMerchantAddress}
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
            <LineItemList
              items={displayLineItems}
              editing={editing}
              onUpdateItem={handleUpdateLineItem}
              onDeleteItem={handleDeleteLineItem}
              onAddItem={handleAddLineItem}
            />

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
                    onPress={() => router.push(`/expense/${exp.id}`)}
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

        {/* Spacer for sticky bar */}
        {receipt.status === 'REVIEW' && <View style={{ height: 80 }} />}

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

      {/* Sticky bottom action bar */}
      {receipt.status === 'REVIEW' && (
        <View style={styles.stickyBar}>
          {suggestedJob && canQuickApprove ? (
            <>
              <View style={styles.stickyBarInner}>
                <View style={styles.suggestedChip}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={styles.suggestedChipText} numberOfLines={1}>
                    {suggestedJob.name}
                  </Text>
                </View>
                <Button
                  title="Quick Approve"
                  onPress={handleQuickApprove}
                  variant="primary"
                  style={styles.stickyMainBtn}
                  loading={createExpense.isPending || approveReceipt.isPending}
                />
              </View>
              <TouchableOpacity
                onPress={handleApprove}
                style={styles.customizeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.customizeText}>Customize...</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.stickyBarInner}>
              <Button
                title="Approve"
                onPress={handleApprove}
                variant="primary"
                style={styles.stickyMainBtn}
                loading={approveReceipt.isPending}
              />
            </View>
          )}
          <TouchableOpacity
            onPress={handleReject}
            style={styles.stickyRejectBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.stickyRejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

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
        onCreateSplitAndApprove={handleCreateSplitAndApprove}
        loading={createExpense.isPending || createExpenseBatch.isPending || approveReceipt.isPending}
      />

      {receipt.imageUrl && (
        <FullScreenImageViewer
          visible={imageViewerVisible}
          uri={receipt.imageUrl}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: ReturnType<typeof createTypography>) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  expandHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stickyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    flexShrink: 1,
  },
  suggestedChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  stickyMainBtn: {
    flex: 1,
  },
  customizeBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  customizeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  stickyRejectBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  stickyRejectText: {
    fontSize: 14,
    color: colors.textMuted,
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
