import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Input } from '../ui';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useJobs } from '../../hooks/useJobs';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius, createTypography, MIN_TOUCH_TARGET } from '../../theme';

interface ManualMileageFormProps {
  visible: boolean;
  onClose: () => void;
}

export function ManualMileageForm({ visible, onClose }: ManualMileageFormProps) {
  const createExpense = useCreateExpense();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const { colors } = useTheme();
  const typography = useMemo(() => createTypography(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [miles, setMiles] = useState('');
  const [jobId, setJobId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const milesNum = parseFloat(miles) || 0;
  const deductionCents = Math.round(milesNum * IRS_MILEAGE_RATE_CENTS);

  const handleSubmit = async () => {
    if (!miles || milesNum <= 0) {
      setError('Please enter miles driven');
      return;
    }
    setError('');

    try {
      await createExpense.mutateAsync({
        jobId: jobId || undefined,
        amount: deductionCents,
        description: `Mileage: ${startLocation || '?'} → ${endLocation || '?'} (${miles} mi)`,
        category: 'OVERHEAD',
        mileage: milesNum,
        date,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      // Reset form
      setStartLocation('');
      setEndLocation('');
      setMiles('');
      setJobId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log mileage');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={typography.h3}>Manual Mileage Entry</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Start Location"
            value={startLocation}
            onChangeText={setStartLocation}
            placeholder="Office"
          />
          <Input
            label="End Location"
            value={endLocation}
            onChangeText={setEndLocation}
            placeholder="Job site"
          />
          <Input
            label="Miles *"
            value={miles}
            onChangeText={setMiles}
            keyboardType="decimal-pad"
            placeholder="0.0"
          />
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          {milesNum > 0 && (
            <View style={styles.deductionCard}>
              <Text style={styles.deductionLabel}>Estimated Deduction</Text>
              <Text style={styles.deductionValue}>
                {formatMoney(deductionCents)}
              </Text>
              <Text style={styles.rateNote}>
                {milesNum.toFixed(1)} mi × ${(IRS_MILEAGE_RATE_CENTS / 100).toFixed(2)}/mi
              </Text>
            </View>
          )}

          {/* Job selection */}
          <Text style={styles.label}>Job (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.jobScroll}
          >
            {jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={[
                  styles.jobChip,
                  jobId === job.id && styles.jobChipActive,
                ]}
                onPress={() => setJobId(jobId === job.id ? '' : job.id)}
              >
                <Text
                  style={[
                    styles.jobChipText,
                    jobId === job.id && styles.jobChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {job.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Log Mileage"
            onPress={handleSubmit}
            loading={createExpense.isPending}
            disabled={!miles || milesNum <= 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  deductionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  deductionLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  deductionValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  rateNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  jobScroll: {
    marginBottom: spacing.lg,
  },
  jobChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  jobChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jobChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  jobChipTextActive: {
    color: colors.white,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
