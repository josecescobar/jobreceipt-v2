import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '../../stores/ui.store';
import { useBatchDeleteExpenses, useBatchUpdateExpenses } from '../../hooks/useExpenses';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { Job } from '@jobreceipt/shared';

const CATEGORIES = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD'];

interface BatchActionBarProps {
  jobs: Job[];
}

export function BatchActionBar({ jobs }: BatchActionBarProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedExpenseIds,
    expenseSelectionMode,
    clearExpenseSelection,
    addToast,
  } = useUIStore();

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const batchDelete = useBatchDeleteExpenses();
  const batchUpdate = useBatchUpdateExpenses();

  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: expenseSelectionMode ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [expenseSelectionMode, slideAnim]);

  const count = selectedExpenseIds.length;

  const handleDelete = () => {
    Alert.alert(
      `Delete ${count} expense${count !== 1 ? 's' : ''}?`,
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await batchDelete.mutateAsync(selectedExpenseIds);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              addToast({
                id: `batch_delete_${Date.now()}`,
                message: `Deleted ${result.count} expense${result.count !== 1 ? 's' : ''}`,
                type: 'success',
              });
              clearExpenseSelection();
            } catch {
              addToast({
                id: `batch_delete_err_${Date.now()}`,
                message: 'Failed to delete expenses',
                type: 'error',
              });
            }
          },
        },
      ],
    );
  };

  const handleReassign = (jobId: string, jobName: string) => {
    setShowJobPicker(false);
    batchUpdate
      .mutateAsync({ ids: selectedExpenseIds, updates: { jobId } })
      .then((result) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addToast({
          id: `batch_reassign_${Date.now()}`,
          message: `Moved ${result.count} expense${result.count !== 1 ? 's' : ''} to ${jobName}`,
          type: 'success',
        });
        clearExpenseSelection();
      })
      .catch(() => {
        addToast({
          id: `batch_reassign_err_${Date.now()}`,
          message: 'Failed to reassign expenses',
          type: 'error',
        });
      });
  };

  const handleCategorize = (category: string) => {
    setShowCategoryPicker(false);
    batchUpdate
      .mutateAsync({ ids: selectedExpenseIds, updates: { category } })
      .then((result) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addToast({
          id: `batch_cat_${Date.now()}`,
          message: `Updated ${result.count} expense${result.count !== 1 ? 's' : ''} to ${category}`,
          type: 'success',
        });
        clearExpenseSelection();
      })
      .catch(() => {
        addToast({
          id: `batch_cat_err_${Date.now()}`,
          message: 'Failed to update category',
          type: 'error',
        });
      });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const isLoading = batchDelete.isPending || batchUpdate.isPending;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + spacing.sm, transform: [{ translateY }] },
      ]}
      pointerEvents={expenseSelectionMode ? 'auto' : 'none'}
    >
      {/* Main bar */}
      <View style={styles.bar}>
        <TouchableOpacity onPress={clearExpenseSelection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.countText}>
          {count} selected
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => { setShowCategoryPicker(!showCategoryPicker); setShowJobPicker(false); }}
            disabled={count === 0 || isLoading}
          >
            <Ionicons name="pricetag-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Category</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => { setShowJobPicker(!showJobPicker); setShowCategoryPicker(false); }}
            disabled={count === 0 || isLoading}
          >
            <Ionicons name="briefcase-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Reassign</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={count === 0 || isLoading}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Job picker dropdown */}
      {showJobPicker && (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Reassign to job</Text>
          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.pickerItem}
                onPress={() => handleReassign(job.id, job.name)}
              >
                <Text style={styles.pickerItemText} numberOfLines={1}>{job.name}</Text>
              </TouchableOpacity>
            ))}
            {jobs.length === 0 && (
              <Text style={styles.pickerEmpty}>No active jobs</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Category picker dropdown */}
      {showCategoryPicker && (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Set category</Text>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.pickerItem}
              onPress={() => handleCategorize(cat)}
            >
              <Text style={styles.pickerItemText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  deleteButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error + '20',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    padding: spacing.sm,
    maxHeight: 200,
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pickerScroll: {
    maxHeight: 160,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.text,
  },
  pickerEmpty: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.sm,
  },
});
