import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import { useCreateExpense } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { expensesApi } from '../../src/api/expenses';
import { dollarsToCents, formatMoney } from '../../src/lib/format';
import { colors, spacing, borderRadius } from '../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials', icon: '🧱' },
  { key: 'LABOR', label: 'Labor', icon: '👷' },
  { key: 'EQUIPMENT', label: 'Equipment', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subs', icon: '🤝' },
  { key: 'OVERHEAD', label: 'Overhead', icon: '📋' },
];

export default function CreateExpenseScreen() {
  const router = useRouter();
  const createExpense = useCreateExpense();
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

  const amountNum = parseFloat(amount) || 0;

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
    setError('');
    setUploading(true);

    try {
      let imageKey: string | undefined;
      if (imageUri) {
        imageKey = await expensesApi.uploadImage(imageUri);
      }
      await createExpense.mutateAsync({
        jobId,
        amount: dollarsToCents(amountNum),
        description: description.trim(),
        category: category || undefined,
        imageKey: imageKey || undefined,
        date: date || new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setUploading(false);
    }
  };

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
            placeholder="What was this for?"
          />

          {/* Date */}
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
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

          {/* Amount preview */}
          {amountNum > 0 && (
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
            title={uploading ? 'Uploading Photo...' : 'Add Expense'}
            onPress={handleSubmit}
            loading={createExpense.isPending || uploading}
            disabled={!jobId || !amount || amountNum <= 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
