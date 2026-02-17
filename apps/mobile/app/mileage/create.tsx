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
import { Button, Input } from '../../src/components/ui';
import { useCreateMileageTrip } from '../../src/hooks/useMileage';
import { useJobs } from '../../src/hooks/useJobs';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { formatMoney } from '../../src/lib/format';
import { colors, spacing, borderRadius, typography } from '../../src/theme';

export default function CreateMileageScreen() {
  const router = useRouter();
  const createTrip = useCreateMileageTrip();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [jobId, setJobId] = useState('');
  const [miles, setMiles] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');

  const milesNum = parseFloat(miles) || 0;
  const deductionCents = Math.round(milesNum * IRS_MILEAGE_RATE_CENTS);

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Please select a job');
      return;
    }
    if (!miles || milesNum <= 0) {
      setError('Please enter miles driven');
      return;
    }
    setError('');

    try {
      await createTrip.mutateAsync({
        jobId,
        startLat: 0,
        startLng: 0,
        endLat: 0,
        endLng: 0,
        distanceMiles: milesNum,
        date,
        purpose: purpose || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log mileage trip');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Log Mileage Trip" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Job *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.jobScroll}
          >
            {jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={[styles.jobChip, jobId === job.id && styles.jobChipActive]}
                onPress={() => setJobId(jobId === job.id ? '' : job.id)}
              >
                <Text
                  style={[styles.jobChipText, jobId === job.id && styles.jobChipTextActive]}
                  numberOfLines={1}
                >
                  {job.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
          <Input
            label="Purpose"
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Site visit, material pickup, etc."
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Log Trip"
            onPress={handleSubmit}
            loading={createTrip.isPending}
            disabled={!jobId || !miles || milesNum <= 0}
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
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
