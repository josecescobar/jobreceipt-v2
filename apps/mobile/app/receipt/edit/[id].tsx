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
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import { useReceipt, useUpdateReceipt } from '../../../src/hooks/useReceipts';
import { useJobs } from '../../../src/hooks/useJobs';
import { centsToDollars, dollarsToCents, formatMoney } from '../../../src/lib/format';
import { useTheme, type ThemeColors, spacing } from '../../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials', icon: '🧱' },
  { key: 'LABOR', label: 'Labor', icon: '👷' },
  { key: 'EQUIPMENT', label: 'Equipment', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subs', icon: '🤝' },
  { key: 'OVERHEAD', label: 'Overhead', icon: '📋' },
];

export default function EditReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: receipt, isLoading } = useReceipt(id ?? '');
  const updateReceipt = useUpdateReceipt();

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(() => jobsData?.pages?.flatMap((p) => p.data) ?? [], [jobsData]);

  // Form state
  const [merchantName, setMerchantName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  const [jobId, setJobId] = useState('');
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate from OCR data when receipt loads
  useEffect(() => {
    if (!receipt) return;
    setMerchantName(receipt.merchantName ?? '');
    setTotalAmount(
      receipt.totalAmount != null ? centsToDollars(receipt.totalAmount).toFixed(2) : '',
    );
    setTaxAmount(
      receipt.taxAmount != null ? centsToDollars(receipt.taxAmount).toFixed(2) : '',
    );
    setTransactionDate(receipt.transactionDate ?? '');

    setJobId(receipt.suggestedJobId ?? '');
  }, [receipt]);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === jobId) ?? null, [jobs, jobId]);


  const handleSave = async () => {
    setError('');

    const totalCents = totalAmount ? dollarsToCents(parseFloat(totalAmount)) : null;
    const taxCents = taxAmount ? dollarsToCents(parseFloat(taxAmount)) : null;

    if (totalAmount && isNaN(parseFloat(totalAmount))) {
      setError('Total amount must be a valid number.');
      return;
    }

    try {
      await updateReceipt.mutateAsync({
        id: id!,
        updates: {
          merchantName: merchantName.trim() || undefined,
          totalAmount: totalCents ?? undefined,
          taxAmount: taxCents ?? undefined,
          transactionDate: transactionDate || undefined,
          suggestedJobId: jobId || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Failed to save changes. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Edit Receipt" showBack />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!receipt) {
    return (
      <Screen>
        <Header title="Edit Receipt" showBack />
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Receipt not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Edit Receipt" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Receipt image preview */}
          {receipt.imageDownloadUrl != null ? (
            <Image
              source={{ uri: receipt.imageDownloadUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.imagePlaceholderText}>Receipt Image</Text>
            </View>
          )}

          {/* OCR notice */}
          <View style={styles.ocrBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.ocrBannerText}>
              Review and correct the OCR-extracted data below.
            </Text>
          </View>

          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Merchant */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Merchant Name</Text>
            <Input
              value={merchantName}
              onChangeText={setMerchantName}
              placeholder="e.g. Home Depot"
            />
          </View>

          {/* Total amount */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Total Amount ($)</Text>
            <Input
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Tax amount */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tax Amount ($)</Text>
            <Input
              value={taxAmount}
              onChangeText={setTaxAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Transaction Date</Text>
            <DatePickerField
              value={transactionDate}
              onChange={setTransactionDate}
              placeholder="Select date"
            />
          </View>



          {/* Job assignment */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Assign to Job</Text>
            <TouchableOpacity
              style={styles.jobSelector}
              onPress={() => setShowJobPicker(!showJobPicker)}
            >
              <Text style={selectedJob ? styles.jobSelectorValue : styles.jobSelectorPlaceholder}>
                {selectedJob ? selectedJob.name : 'Select a job (optional)'}
              </Text>
              <Ionicons
                name={showJobPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showJobPicker && (
              <View style={styles.jobList}>
                <TouchableOpacity
                  style={styles.jobOption}
                  onPress={() => { setJobId(''); setShowJobPicker(false); }}
                >
                  <Text style={styles.jobOptionText}>None</Text>
                </TouchableOpacity>
                {jobs.map((j) => (
                  <TouchableOpacity
                    key={j.id}
                    style={[styles.jobOption, jobId === j.id && styles.jobOptionActive]}
                    onPress={() => { setJobId(j.id); setShowJobPicker(false); }}
                  >
                    <Text style={[styles.jobOptionText, jobId === j.id && styles.jobOptionTextActive]}>
                      {j.name}
                    </Text>
                    {jobId === j.id && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Save */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={updateReceipt.isPending}
            variant="primary"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mutedText: { color: colors.textMuted, fontSize: 16 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    receiptImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
    },
    imagePlaceholder: {
      height: 120,
      borderRadius: 12,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    imagePlaceholderText: { fontSize: 13, color: colors.textMuted },
    ocrBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    ocrBannerText: { fontSize: 13, color: colors.primary, flex: 1 },
    errorBanner: {
      backgroundColor: colors.error + '18',
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    errorText: { fontSize: 13, color: colors.error },
    field: { gap: spacing.xs },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    categoryRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryChipIcon: { fontSize: 15 },
    categoryChipLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    categoryChipLabelActive: { color: colors.white },
    jobSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    jobSelectorValue: { fontSize: 14, color: colors.text },
    jobSelectorPlaceholder: { fontSize: 14, color: colors.textMuted },
    jobList: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    jobOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    jobOptionActive: { backgroundColor: colors.primary + '15' },
    jobOptionText: { fontSize: 14, color: colors.text },
    jobOptionTextActive: { color: colors.primary, fontWeight: '600' },
    saveButton: { marginTop: spacing.sm },
  });
