import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreatePermit } from '../../src/hooks/usePermits';
import { useJobs } from '../../src/hooks/useJobs';
import { dollarsToCents } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const PERMIT_TYPES = [
  { key: 'BUILDING', label: 'Building' },
  { key: 'ELECTRICAL', label: 'Electrical' },
  { key: 'PLUMBING', label: 'Plumbing' },
  { key: 'MECHANICAL', label: 'Mechanical' },
  { key: 'FIRE', label: 'Fire' },
  { key: 'DEMOLITION', label: 'Demolition' },
  { key: 'GRADING', label: 'Grading' },
  { key: 'OTHER', label: 'Other' },
] as const;

export default function CreatePermitScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createPermit = useCreatePermit();

  const [selectedJobId, setSelectedJobId] = useState('');
  const [permitNumber, setPermitNumber] = useState('');
  const [selectedType, setSelectedType] = useState('BUILDING');
  const [appliedDate, setAppliedDate] = useState('');
  const [authority, setAuthority] = useState('');
  const [feeStr, setFeeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const allJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const canSubmit = !!selectedJobId && !!selectedType;

  const handleSubmit = async () => {
    if (!selectedJobId) {
      setError('Please select a job');
      return;
    }
    setError('');

    const fee = feeStr
      ? dollarsToCents(parseFloat(feeStr))
      : undefined;

    try {
      await createPermit.mutateAsync({
        jobId: selectedJobId,
        permitNumber: permitNumber.trim() || undefined,
        type: selectedType,
        appliedDate: appliedDate || undefined,
        authority: authority.trim() || undefined,
        fee: fee && !isNaN(fee) ? fee : undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create permit');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Add Permit" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job Picker */}
          <Text style={styles.label}>Job *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            {allJobs.map((job) => {
              const active = selectedJobId === job.id;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedJobId(job.id)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {job.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="Permit Number"
            value={permitNumber}
            onChangeText={setPermitNumber}
            placeholder="e.g. BP-2026-001234"
          />

          {/* Type Picker */}
          <Text style={styles.label}>Permit Type *</Text>
          <View style={styles.typeGrid}>
            {PERMIT_TYPES.map((pt) => {
              const active = selectedType === pt.key;
              return (
                <TouchableOpacity
                  key={pt.key}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setSelectedType(pt.key)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      active && styles.typeChipTextActive,
                    ]}
                  >
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <DatePickerField
            label="Applied Date"
            value={appliedDate}
            onChange={setAppliedDate}
            placeholder="Select date (optional)"
          />

          <Input
            label="Issuing Authority"
            value={authority}
            onChangeText={setAuthority}
            placeholder="e.g. City of Austin Building Dept."
          />

          <Input
            label="Fee ($)"
            value={feeStr}
            onChangeText={setFeeStr}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Permit"
            onPress={handleSubmit}
            loading={createPermit.isPending}
            disabled={!canSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      color: colors.text,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    chipScroll: {
      marginBottom: spacing.md,
    },
    chipRow: {
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 160,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.white,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    typeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    typeChipTextActive: {
      color: colors.white,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
