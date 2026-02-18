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
import { MileageTracker } from '../../src/components/mileage';
import { useCreateMileageTrip } from '../../src/hooks/useMileage';
import { useJobs } from '../../src/hooks/useJobs';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

type Mode = 'track' | 'manual';

interface TrackedData {
  distanceMiles: number;
  deductionCents: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export default function CreateMileageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createTrip = useCreateMileageTrip();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [mode, setMode] = useState<Mode>('track');
  const [jobId, setJobId] = useState('');
  const [miles, setMiles] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [trackedData, setTrackedData] = useState<TrackedData | null>(null);

  const milesNum = mode === 'track' ? (trackedData?.distanceMiles ?? 0) : (parseFloat(miles) || 0);
  const deductionCents = mode === 'track'
    ? (trackedData?.deductionCents ?? 0)
    : Math.round(milesNum * IRS_MILEAGE_RATE_CENTS);

  const handleTripComplete = (data: {
    distanceMiles: number;
    deductionCents: number;
    startCoord: { latitude: number; longitude: number } | null;
    endCoord: { latitude: number; longitude: number } | null;
  }) => {
    setTrackedData({
      distanceMiles: data.distanceMiles,
      deductionCents: data.deductionCents,
      startLat: data.startCoord?.latitude ?? 0,
      startLng: data.startCoord?.longitude ?? 0,
      endLat: data.endCoord?.latitude ?? 0,
      endLng: data.endCoord?.longitude ?? 0,
    });
  };

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Please select a job');
      return;
    }
    if (milesNum <= 0) {
      setError(mode === 'track' ? 'Please track a trip first' : 'Please enter miles driven');
      return;
    }
    setError('');

    try {
      await createTrip.mutateAsync({
        jobId,
        startLat: trackedData?.startLat ?? 0,
        startLng: trackedData?.startLng ?? 0,
        endLat: trackedData?.endLat ?? 0,
        endLng: trackedData?.endLng ?? 0,
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

  const canSubmit = jobId && milesNum > 0;

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
          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'track' && styles.modeTabActive]}
              onPress={() => setMode('track')}
            >
              <Text style={[styles.modeTabText, mode === 'track' && styles.modeTabTextActive]}>
                Track Trip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
              onPress={() => setMode('manual')}
            >
              <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>

          {/* Track mode: GPS tracker */}
          {mode === 'track' && (
            <MileageTracker onTripComplete={handleTripComplete} />
          )}

          {/* Manual mode: miles input */}
          {mode === 'manual' && (
            <>
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
            </>
          )}

          {/* Shared fields */}
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
            label="Purpose"
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Site visit, material pickup, etc."
          />

          {/* Deduction preview */}
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md - 2,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.white,
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
