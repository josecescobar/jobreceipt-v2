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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateTimeEntry } from '../../src/hooks/useTimeTracking';
import { useJobs } from '../../src/hooks/useJobs';
import { formatMoney, dollarsToCents, centsToDollars } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CreateTimeEntryScreen() {
  const router = useRouter();
  const { jobId: initialJobId } = useLocalSearchParams<{ jobId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createEntry = useCreateTimeEntry();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const [jobId, setJobId] = useState(initialJobId || '');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const totalMinutes = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
  const rateCents = dollarsToCents(parseFloat(hourlyRate) || 0);
  const totalCost = Math.round((totalMinutes / 60) * rateCents);

  const canSubmit = jobId && totalMinutes > 0 && rateCents > 0;

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Please select a job');
      return;
    }
    if (totalMinutes <= 0) {
      setError('Please enter time worked');
      return;
    }
    if (rateCents <= 0) {
      setError('Please enter an hourly rate');
      return;
    }
    setError('');

    try {
      await createEntry.mutateAsync({
        jobId,
        date,
        durationMinutes: totalMinutes,
        hourlyRate: rateCents,
        description: description || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log time entry');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Log Time" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Duration */}
          <Text style={styles.sectionLabel}>Duration *</Text>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <Input
                label="Hours"
                value={hours}
                onChangeText={setHours}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
            <Text style={styles.durationSeparator}>:</Text>
            <View style={styles.durationField}>
              <Input
                label="Minutes"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                placeholder="00"
              />
            </View>
          </View>

          {/* Hourly Rate */}
          <Input
            label="Hourly Rate ($) *"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {/* Date */}
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
          />

          {/* Job Selection */}
          <Text style={styles.sectionLabel}>Job *</Text>
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

          {/* Description */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Framing, electrical work, etc."
          />

          {/* Cost Preview */}
          {totalMinutes > 0 && rateCents > 0 && (
            <View style={styles.costCard}>
              <Text style={styles.costLabel}>Total Cost</Text>
              <Text style={styles.costValue}>{formatMoney(totalCost)}</Text>
              <Text style={styles.costNote}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m @ ${centsToDollars(rateCents).toFixed(2)}/hr
              </Text>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Log Time"
            onPress={handleSubmit}
            loading={createEntry.isPending}
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  durationField: {
    flex: 1,
  },
  durationSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
    paddingTop: spacing.lg,
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
  costCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  costLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  costNote: {
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
