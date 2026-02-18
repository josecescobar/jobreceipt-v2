import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActionSheetIOS,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateExpense, useCreateExpenseBatch } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { expensesApi } from '../../src/api/expenses';
import { dollarsToCents, formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials', icon: '🧱' },
  { key: 'LABOR', label: 'Labor', icon: '👷' },
  { key: 'EQUIPMENT', label: 'Equipment', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subs', icon: '🤝' },
  { key: 'OVERHEAD', label: 'Overhead', icon: '📋' },
];

interface SplitRow {
  jobId: string;
  amount: string;
}

export default function CreateExpenseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createExpense = useCreateExpense();
  const createExpenseBatch = useCreateExpenseBatch();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [jobId, setJobId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Split mode
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>([
    { jobId: '', amount: '' },
    { jobId: '', amount: '' },
  ]);

  const amountNum = parseFloat(amount) || 0;
  const amountCents = dollarsToCents(amountNum);

  // Split calculations
  const splitTotal = splits.reduce((sum, s) => {
    const val = parseFloat(s.amount);
    return sum + (isNaN(val) ? 0 : dollarsToCents(val));
  }, 0);
  const splitDiff = amountCents - splitTotal;
  const splitsValid = splitMode && amountNum > 0 && description.trim().length > 0 &&
    splits.every((s) => s.jobId && parseFloat(s.amount) > 0) && Math.abs(splitDiff) <= 1;

  const handleToggleSplit = () => {
    if (!splitMode) {
      const initialSplits: SplitRow[] = [
        { jobId: jobId || '', amount: amountNum > 0 ? amount : '' },
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

  const handlePickPhoto = () => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel'];
    const cancelIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (index) => {
          if (index === 0) await launchCamera();
          else if (index === 1) await launchLibrary();
        },
      );
    } else {
      Alert.alert('Add Photo', 'Choose a source', [
        { text: 'Take Photo', onPress: launchCamera },
        { text: 'Choose from Library', onPress: launchLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const launchLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (splitMode) {
      if (!splitsValid) return;
    } else {
      if (!jobId) {
        setError('Please select a job');
        return;
      }
      if (!amount || amountNum <= 0) {
        setError('Please enter an amount');
        return;
      }
      if (!description.trim()) {
        setError('Please enter a description');
        return;
      }
    }
    setError('');
    setUploading(true);

    try {
      let imageKey: string | undefined;
      if (imageUri) {
        imageKey = await expensesApi.uploadImage(imageUri);
      }

      if (splitMode) {
        const items = splits.map((s) => ({
          jobId: s.jobId,
          amount: dollarsToCents(parseFloat(s.amount)),
          description: description.trim(),
          category: category || undefined,
          imageKey: imageKey || undefined,
          date: date || new Date().toISOString(),
        }));
        await createExpenseBatch.mutateAsync(items);
      } else {
        await createExpense.mutateAsync({
          jobId,
          amount: dollarsToCents(amountNum),
          description: description.trim(),
          category: category || undefined,
          imageKey: imageKey || undefined,
          date: date || new Date().toISOString(),
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = splitMode
    ? splitsValid
    : !!(jobId && amount && amountNum > 0);

  return (
    <Screen padded={false}>
      <Header title="Add Expense" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
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
            placeholder="What was this for?"
          />

          {/* Date */}
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
          />

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
              {amountNum > 0 && (
                <View style={[
                  styles.splitTotalCard,
                  Math.abs(splitDiff) <= 1 && styles.splitTotalMatch,
                  splitDiff < -1 && styles.splitTotalOver,
                ]}>
                  <Text style={styles.splitTotalLabel}>
                    Split Total: {formatMoney(splitTotal)} / {formatMoney(amountCents)}
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
                      {formatMoney(Math.abs(splitDiff))} over total
                    </Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
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

          {/* Photo */}
          <Text style={styles.label}>Photo</Text>
          {imageUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: imageUri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickPhoto}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}

          {/* Amount preview (single mode only) */}
          {!splitMode && amountNum > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Expense Total</Text>
              <Text style={styles.previewValue}>
                {formatMoney(dollarsToCents(amountNum))}
              </Text>
              {category && (
                <Text style={styles.previewCategory}>
                  {CATEGORIES.find((c) => c.key === category)?.label}
                </Text>
              )}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={uploading ? 'Uploading Photo...' : splitMode ? 'Create Split Expenses' : 'Add Expense'}
            onPress={handleSubmit}
            loading={createExpense.isPending || createExpenseBatch.isPending || uploading}
            disabled={!canSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  addPhotoText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  photoPreview: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
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
  previewCategory: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
