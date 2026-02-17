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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import {
  useMileageTrip,
  useUpdateMileageTrip,
  useDeleteMileageTrip,
} from '../../../src/hooks/useMileage';
import { useJobs } from '../../../src/hooks/useJobs';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { formatMoney } from '../../../src/lib/format';
import { colors, spacing, borderRadius } from '../../../src/theme';

export default function EditMileageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading } = useMileageTrip(id ?? '');
  const updateTrip = useUpdateMileageTrip();
  const deleteTrip = useDeleteMileageTrip();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [jobId, setJobId] = useState('');
  const [miles, setMiles] = useState('');
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (trip) {
      setJobId(trip.jobId || '');
      setMiles(trip.distanceMiles?.toString() || '');
      setDate(trip.date ? trip.date.toString().split('T')[0] : '');
      setPurpose(trip.purpose || '');
    }
  }, [trip]);

  const milesNum = parseFloat(miles) || 0;
  const deductionCents = Math.round(milesNum * IRS_MILEAGE_RATE_CENTS);

  const handleSave = async () => {
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
      await updateTrip.mutateAsync({
        id: id!,
        updates: {
          jobId,
          distanceMiles: milesNum,
          date,
          purpose: purpose || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update trip');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this mileage trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrip.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete trip');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !trip) {
    return (
      <Screen padded={false}>
        <Header title="Edit Trip" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Trip not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Edit Trip" showBack />
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
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
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
            title="Save Changes"
            onPress={handleSave}
            loading={updateTrip.isPending}
            disabled={!jobId || !miles || milesNum <= 0}
          />

          <Button
            title="Delete Trip"
            onPress={handleDelete}
            variant="danger"
            loading={deleteTrip.isPending}
            style={styles.deleteButton}
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
  deleteButton: {
    marginTop: spacing.md,
  },
});
