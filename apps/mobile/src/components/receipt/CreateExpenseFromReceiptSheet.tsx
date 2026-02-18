import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { formatMoney, centsToDollars, dollarsToCents } from '../../lib/format';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius, MIN_TOUCH_TARGET } from '../../theme';
import type { Receipt, Job } from '@jobreceipt/shared';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials', icon: '🧱' },
  { key: 'LABOR', label: 'Labor', icon: '👷' },
  { key: 'EQUIPMENT', label: 'Equipment', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subs', icon: '🤝' },
  { key: 'OVERHEAD', label: 'Overhead', icon: '📋' },
];

interface ExpenseItem {
  jobId: string;
  amount: number;
  description: string;
  category?: string;
  date: string;
  receiptId: string;
}

interface CreateExpenseFromReceiptSheetProps {
  visible: boolean;
  onClose: () => void;
  receipt: Receipt;
  jobs: Job[];
  onCreateAndApprove: (data: ExpenseItem) => void;
  onCreateSplitAndApprove?: (items: ExpenseItem[]) => void;
  loading?: boolean;
}

interface SplitRow {
  jobId: string;
  amount: string;
}

export function CreateExpenseFromReceiptSheet({
  visible,
  onClose,
  receipt,
  jobs,
  onCreateAndApprove,
  onCreateSplitAndApprove,
  loading,
}: CreateExpenseFromReceiptSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  const [jobId, setJobId] = useState(receipt.suggestedJobId ?? '');
  const [category, setCategory] = useState(receipt.suggestedCategory ?? 'MATERIALS');
  const [description, setDescription] = useState(
    `Receipt from ${receipt.merchantName || 'Unknown'}`,
  );

  // Split mode state
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>([
    { jobId: '', amount: '' },
    { jobId: '', amount: '' },
  ]);

  const amount = receipt.totalAmount ?? 0;
  const date = receipt.transactionDate
    ? receipt.transactionDate.toString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Split calculations
  const splitTotal = splits.reduce((sum, s) => {
    const val = parseFloat(s.amount);
    return sum + (isNaN(val) ? 0 : dollarsToCents(val));
  }, 0);
  const splitDiff = amount - splitTotal;
  const splitsValid = splitMode && splits.every((s) => s.jobId && parseFloat(s.amount) > 0) && Math.abs(splitDiff) <= 1;

  const handleToggleSplit = () => {
    if (!splitMode) {
      // Entering split mode — pre-fill first row with selected job
      const initialSplits: SplitRow[] = [
        { jobId: jobId || '', amount: amount > 0 ? centsToDollars(amount).toString() : '' },
        { jobId: '', amount: '' },
      ];
      setSplits(initialSplits);
    }
    setSplitMode(!splitMode);
  };

  const handleUpdateSplit = (index: number, field: keyof SplitRow, value: string) => {
    setSplits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSplit = () => {
    setSplits((prev) => [...prev, { jobId: '', amount: '' }]);
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 2) return;
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (splitMode && onCreateSplitAndApprove) {
      const items: ExpenseItem[] = splits.map((s) => ({
        jobId: s.jobId,
        amount: dollarsToCents(parseFloat(s.amount)),
        description: description.trim(),
        category: category || undefined,
        date,
        receiptId: receipt.id,
      }));
      onCreateSplitAndApprove(items);
    } else {
      if (!jobId) return;
      onCreateAndApprove({
        jobId,
        amount,
        description: description.trim(),
        category: category || undefined,
        date,
        receiptId: receipt.id,
      });
    }
  };

  const canSubmit = splitMode ? splitsValid : !!jobId;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h3}>Create Expense</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount display */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Receipt Total</Text>
            <Text style={styles.amountValue}>{formatMoney(amount)}</Text>
            {receipt.merchantName && (
              <Text style={styles.amountMerchant}>{receipt.merchantName}</Text>
            )}
          </View>

          {splitMode ? (
            <>
              {/* Split rows */}
              <Text style={styles.label}>Split Across Jobs</Text>
              {splits.map((split, index) => (
                <View key={index} style={styles.splitRow}>
                  <View style={styles.splitJobSection}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.splitJobScroll}
                    >
                      {jobs.map((job) => (
                        <TouchableOpacity
                          key={job.id}
                          style={[styles.chip, split.jobId === job.id && styles.chipActive]}
                          onPress={() => handleUpdateSplit(index, 'jobId', split.jobId === job.id ? '' : job.id)}
                        >
                          <Text
                            style={[styles.chipText, split.jobId === job.id && styles.chipTextActive]}
                            numberOfLines={1}
                          >
                            {job.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.splitAmountRow}>
                    <View style={styles.splitAmountInput}>
                      <Text style={styles.splitAmountPrefix}>$</Text>
                      <TextInput
                        style={styles.splitAmountField}
                        value={split.amount}
                        onChangeText={(val) => handleUpdateSplit(index, 'amount', val)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    {splits.length > 2 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveSplit(index)}
                        style={styles.splitRemoveBtn}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {/* Add split button */}
              <TouchableOpacity onPress={handleAddSplit} style={styles.addSplitBtn}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addSplitText}>Add another job</Text>
              </TouchableOpacity>

              {/* Split total indicator */}
              <View style={[
                styles.splitTotalCard,
                Math.abs(splitDiff) <= 1 && styles.splitTotalMatch,
                splitDiff < -1 && styles.splitTotalOver,
              ]}>
                <Text style={styles.splitTotalLabel}>
                  Split Total: {formatMoney(splitTotal)} / {formatMoney(amount)}
                </Text>
                {Math.abs(splitDiff) <= 1 ? (
                  <View style={styles.splitStatusRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.splitStatusText, { color: colors.success }]}>Amounts match</Text>
                  </View>
                ) : splitDiff > 0 ? (
                  <Text style={[styles.splitStatusText, { color: colors.warning }]}>
                    {formatMoney(splitDiff)} remaining to allocate
                  </Text>
                ) : (
                  <Text style={[styles.splitStatusText, { color: colors.error }]}>
                    {formatMoney(Math.abs(splitDiff))} over receipt total
                  </Text>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Single job picker */}
              <Text style={styles.label}>Assign to Job *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                {jobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.chip, jobId === job.id && styles.chipActive]}
                    onPress={() => setJobId(jobId === job.id ? '' : job.id)}
                  >
                    <Text
                      style={[styles.chipText, jobId === job.id && styles.chipTextActive]}
                      numberOfLines={1}
                    >
                      {job.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {jobs.length === 0 && (
                  <Text style={styles.noJobs}>No active jobs</Text>
                )}
              </ScrollView>
            </>
          )}

          {/* Split toggle */}
          {jobs.length >= 2 && (
            <TouchableOpacity onPress={handleToggleSplit} style={styles.splitToggle}>
              <Ionicons
                name={splitMode ? 'return-up-back-outline' : 'git-branch-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.splitToggleText}>
                {splitMode ? 'Single job instead' : 'Split across jobs'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Category chips */}
          <View style={styles.categoryHeader}>
            <Text style={styles.label}>Category</Text>
            {receipt.suggestedCategory && (
              <View style={styles.suggestedHint}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.suggestedHintText}>Suggested</Text>
              </View>
            )}
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  category === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(category === cat.key ? '' : cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.key && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={splitMode ? 'Create Split Expenses & Approve' : 'Create Expense & Approve'}
            onPress={handleCreate}
            loading={loading}
            disabled={!canSubmit}
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: spacing.lg,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  amountMerchant: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  suggestedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestedHintText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  chipScroll: {
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  noJobs: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  // Split mode styles
  splitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  splitToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  splitRow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitJobSection: {
    marginBottom: spacing.sm,
  },
  splitJobScroll: {
    flexGrow: 0,
  },
  splitAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  splitAmountInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  splitAmountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: 4,
  },
  splitAmountField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  splitRemoveBtn: {
    padding: spacing.xs,
  },
  addSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  addSplitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  splitTotalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  splitTotalMatch: {
    borderColor: colors.success,
  },
  splitTotalOver: {
    borderColor: colors.error,
  },
  splitTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  splitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  splitStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
