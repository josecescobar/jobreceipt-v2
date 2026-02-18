import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateRecurringExpense } from '../../src/hooks/useRecurringExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { dollarsToCents, formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials', icon: '🧱' },
  { key: 'LABOR', label: 'Labor', icon: '👷' },
  { key: 'EQUIPMENT', label: 'Equipment', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subs', icon: '🤝' },
  { key: 'OVERHEAD', label: 'Overhead', icon: '📋' },
];

const FREQUENCIES = [
  { key: 'WEEKLY' as const, label: 'Weekly' },
  { key: 'BIWEEKLY' as const, label: 'Every 2 Weeks' },
  { key: 'MONTHLY' as const, label: 'Monthly' },
];

export default function CreateRecurringExpenseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createMutation = useCreateRecurringExpense();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [jobId, setJobId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const amountNum = parseFloat(amount) || 0;

  const handleSubmit = async () => {
    if (!jobId) { setError('Please select a job'); return; }
    if (!amount || amountNum <= 0) { setError('Please enter an amount'); return; }
    if (!description.trim()) { setError('Please enter a description'); return; }
    setError('');

    try {
      await createMutation.mutateAsync({
        jobId,
        amount: dollarsToCents(amountNum),
        description: description.trim(),
        category: category || undefined,
        frequency,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create recurring expense');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Recurring Expense" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job picker */}
          <Text style={styles.label}>Job *</Text>
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

          {/* Amount */}
          <Input
            label="Amount *"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            prefix="$"
            placeholder="0.00"
          />

          {/* Description */}
          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Weekly fuel fill-up"
          />

          {/* Frequency */}
          <Text style={styles.label}>Frequency *</Text>
          <View style={styles.frequencyRow}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.key}
                style={[
                  styles.frequencyChip,
                  frequency === freq.key && styles.frequencyChipActive,
                ]}
                onPress={() => setFrequency(freq.key)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    frequency === freq.key && styles.frequencyTextActive,
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Date */}
          <DatePickerField
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />

          {/* End Date (optional) */}
          <DatePickerField
            label="End Date (optional)"
            value={endDate}
            onChange={setEndDate}
          />

          {/* Category chips */}
          <Text style={styles.label}>Category</Text>
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

          {/* Preview */}
          {amountNum > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>
                {FREQUENCIES.find((f) => f.key === frequency)?.label} Expense
              </Text>
              <Text style={styles.previewValue}>
                {formatMoney(dollarsToCents(amountNum))}
              </Text>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Recurring Expense"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={!jobId || !amount || amountNum <= 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
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
    frequencyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    frequencyChip: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    frequencyChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    frequencyText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    frequencyTextActive: {
      color: colors.white,
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
    categoryIcon: { fontSize: 14 },
    categoryText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    categoryTextActive: {
      color: colors.white,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    previewLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    previewValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
