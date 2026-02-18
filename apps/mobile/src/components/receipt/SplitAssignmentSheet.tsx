import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius, MIN_TOUCH_TARGET } from '../../theme';
import { formatMoney } from '../../lib/format';
import type { ReceiptLineItem, Job } from '@jobreceipt/shared';

interface Assignment {
  lineItemIndex: number;
  jobId: string;
}

interface SplitAssignmentSheetProps {
  visible: boolean;
  onClose: () => void;
  lineItems: ReceiptLineItem[];
  jobs: Job[];
  onSave: (assignments: Assignment[]) => void;
}

export function SplitAssignmentSheet({
  visible,
  onClose,
  lineItems,
  jobs,
  onSave,
}: SplitAssignmentSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  const [assignments, setAssignments] = useState<Record<number, string>>({});

  const handleAssign = (lineItemIndex: number, jobId: string) => {
    setAssignments((prev) => ({ ...prev, [lineItemIndex]: jobId }));
  };

  const handleSave = () => {
    const result = Object.entries(assignments).map(([index, jobId]) => ({
      lineItemIndex: parseInt(index),
      jobId,
    }));
    onSave(result);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h3}>Split by Job</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={lineItems}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.lineItem}>
              <View style={styles.lineItemInfo}>
                <Text style={styles.lineItemDesc} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={styles.lineItemAmount}>
                  {formatMoney(item.totalPrice)}
                </Text>
              </View>
              <View style={styles.jobPicker}>
                {jobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={[
                      styles.jobChip,
                      assignments[index] === job.id && styles.jobChipActive,
                    ]}
                    onPress={() => handleAssign(index, job.id)}
                  >
                    <Text
                      style={[
                        styles.jobChipText,
                        assignments[index] === job.id && styles.jobChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {job.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
        />

        <View style={styles.footer}>
          <Button title="Save Assignments" onPress={handleSave} />
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
  list: {
    padding: spacing.lg,
  },
  lineItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lineItemDesc: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: spacing.md,
  },
  lineItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  jobPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  jobChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jobChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  jobChipTextActive: {
    color: colors.white,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
