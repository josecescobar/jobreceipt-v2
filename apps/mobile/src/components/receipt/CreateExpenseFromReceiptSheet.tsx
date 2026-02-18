import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

interface CreateExpenseFromReceiptSheetProps {
  visible: boolean;
  onClose: () => void;
  receipt: Receipt;
  jobs: Job[];
  onCreateAndApprove: (data: {
    jobId: string;
    amount: number;
    description: string;
    category?: string;
    date: string;
    receiptId: string;
  }) => void;
  loading?: boolean;
}

export function CreateExpenseFromReceiptSheet({
  visible,
  onClose,
  receipt,
  jobs,
  onCreateAndApprove,
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

  const amount = receipt.totalAmount ?? 0;
  const date = receipt.transactionDate
    ? receipt.transactionDate.toString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const handleCreate = () => {
    if (!jobId) return;
    onCreateAndApprove({
      jobId,
      amount,
      description: description.trim(),
      category: category || undefined,
      date,
      receiptId: receipt.id,
    });
  };

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

          {/* Job picker */}
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
            title="Create Expense & Approve"
            onPress={handleCreate}
            loading={loading}
            disabled={!jobId}
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
