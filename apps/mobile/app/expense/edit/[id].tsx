import React, { useState, useMemo, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import { useExpense, useUpdateExpense, useDeleteExpense, useApproveExpense, useRejectExpense } from '../../../src/hooks/useExpenses';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useJobs } from '../../../src/hooks/useJobs';
import { expensesApi } from '../../../src/api/expenses';
import { dollarsToCents, centsToDollars, formatMoney } from '../../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials', icon: '🧱' },
  { key: 'LABOR', label: 'Labor', icon: '👷' },
  { key: 'EQUIPMENT', label: 'Equipment', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subs', icon: '🤝' },
  { key: 'OVERHEAD', label: 'Overhead', icon: '📋' },
];

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: expense, isLoading } = useExpense(id ?? '');
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();
  const userRole = useAuthStore((s) => s.userRole);
  const canApprove = userRole === 'OWNER' || userRole === 'BOOKKEEPER';
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [jobId, setJobId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setJobId(expense.jobId || '');
      setAmount(centsToDollars(expense.amount).toString());
      setDescription(expense.description || '');
      setCategory(expense.category || '');
      setDate(expense.date ? expense.date.toString().split('T')[0] : '');
      if (expense.imageKey) {
        expensesApi.getImageUrl(expense.id).then(({ imageUrl }) => {
          if (imageUrl) setExistingImageUrl(imageUrl);
        });
      }
    }
  }, [expense]);

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
      setImageChanged(true);
    }
  };

  const launchLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleRemovePhoto = () => {
    setImageUri(null);
    setExistingImageUrl(null);
    setImageChanged(true);
  };

  const handleSave = async () => {
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
      let imageKey: string | null | undefined;
      if (imageChanged) {
        if (imageUri) {
          imageKey = await expensesApi.uploadImage(imageUri);
        } else {
          imageKey = null; // Remove photo
        }
      }
      await updateExpense.mutateAsync({
        id: id!,
        updates: {
          jobId,
          amount: dollarsToCents(amountNum),
          description: description.trim(),
          category: category || undefined,
          date: date || undefined,
          ...(imageChanged ? { imageKey } : {}),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update expense');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !expense) {
    return (
      <Screen padded={false}>
        <Header title="Edit Expense" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Expense not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Edit Expense" showBack />
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
          {imageUri || existingImageUrl ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: imageUri || existingImageUrl! }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={handleRemovePhoto}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoChange}
                onPress={handlePickPhoto}
              >
                <Ionicons name="camera" size={16} color={colors.white} />
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
            title={uploading ? 'Uploading Photo...' : 'Save Changes'}
            onPress={handleSave}
            loading={updateExpense.isPending || uploading}
            disabled={!jobId || !amount || amountNum <= 0}
          />

          <Button
            title="Delete Expense"
            onPress={handleDelete}
            variant="danger"
            loading={deleteExpense.isPending}
            style={styles.deleteButton}
          />

          {/* Approval section */}
          {canApprove && !expense.approvedAt && (
            <View style={styles.approvalSection}>
              <Text style={styles.approvalTitle}>Approval</Text>
              <View style={styles.approvalButtons}>
                <Button
                  title="Approve"
                  onPress={async () => {
                    try {
                      await approveExpense.mutateAsync(id!);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      router.back();
                    } catch {
                      Alert.alert('Error', 'Failed to approve expense.');
                    }
                  }}
                  loading={approveExpense.isPending}
                />
                <Button
                  title="Reject"
                  variant="danger"
                  onPress={() => {
                    Alert.alert(
                      'Reject Expense?',
                      'This expense will be deleted.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reject',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await rejectExpense.mutateAsync(id!);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                              router.back();
                            } catch {
                              Alert.alert('Error', 'Failed to reject expense.');
                            }
                          },
                        },
                      ],
                    );
                  }}
                  loading={rejectExpense.isPending}
                />
              </View>
            </View>
          )}
          {expense.approvedAt && (
            <View style={styles.approvedInfo}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.approvedText}>
                Approved{(expense as any).approvedBy?.name ? ` by ${(expense as any).approvedBy.name}` : ''}
              </Text>
            </View>
          )}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  photoChange: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteButton: {
    marginTop: spacing.md,
  },
  approvalSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  approvalButtons: {
    gap: spacing.sm,
  },
  approvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  approvedText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
});
