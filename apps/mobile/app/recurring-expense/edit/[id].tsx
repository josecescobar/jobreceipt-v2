import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField, LoadingScreen } from '../../../src/components/ui';
import {
  useRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
} from '../../../src/hooks/useRecurringExpenses';
import { useJobs } from '../../../src/hooks/useJobs';
import { dollarsToCents, centsToDollars, formatMoney } from '../../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

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

export default function EditRecurringExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: item, isLoading } = useRecurringExpense(id);
  const updateMutation = useUpdateRecurringExpense();
  const deleteMutation = useDeleteRecurringExpense();
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (item && !initialized) {
      setJobId(item.jobId);
      setAmount(centsToDollars(item.amount).toString());
      setDescription(item.description);
      setCategory(item.category || '');
      setFrequency(item.frequency);
      setStartDate(item.startDate.split('T')[0]);
      setEndDate(item.endDate ? item.endDate.split('T')[0] : '');
      setIsActive(item.isActive);
      setInitialized(true);
    }
  }, [item, initialized]);

  const amountNum = parseFloat(amount) || 0;

  const handleSave = async () => {
    if (!jobId) { setError('Please select a job'); return; }
    if (!amount || amountNum <= 0) { setError('Please enter an amount'); return; }
    if (!description.trim()) { setError('Please enter a description'); return; }
    setError('');

    try {
      await updateMutation.mutateAsync({
        id,
        updates: {
          jobId,
          amount: dollarsToCents(amountNum),
          description: description.trim(),
          category: category || undefined,
          frequency,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          isActive,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recurring Expense',
      'This will stop future expense creation. Existing expenses will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete recurring expense.');
            }
          },
        },
      ],
    );
  };

  if (isLoading || !item) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Edit Recurring Expense" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active toggle */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Active</Text>
              <Text style={styles.toggleHint}>
                {isActive ? 'Expenses will be created on schedule' : 'Paused — no new expenses'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={isActive ? colors.primary : colors.textMuted}
            />
          </View>

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
            title="Save Changes"
            onPress={handleSave}
            loading={updateMutation.isPending}
            disabled={!jobId || !amount || amountNum <= 0}
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>Delete Recurring Expense</Text>
          </TouchableOpacity>
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
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xl,
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    toggleHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
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
    deleteButton: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      marginTop: spacing.md,
    },
    deleteText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.error,
    },
  });
