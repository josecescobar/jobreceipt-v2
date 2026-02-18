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
import { useCreateWarranty } from '../../src/hooks/useWarranties';
import { useJobs } from '../../src/hooks/useJobs';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CreateWarrantyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createWarranty = useCreateWarranty();
  const { data: jobsData } = useJobs({ status: 'ACTIVE' });

  const jobs = jobsData?.pages?.flatMap((p) => p.data) ?? [];

  const [title, setTitle] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [warrantyProvider, setWarrantyProvider] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit =
    title.trim().length > 0 &&
    selectedJobId.length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!selectedJobId) {
      setError('Please select a job');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!endDate) {
      setError('End date is required');
      return;
    }
    setError('');

    try {
      await createWarranty.mutateAsync({
        jobId: selectedJobId,
        title: title.trim(),
        startDate,
        endDate,
        description: description.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        warrantyProvider: warrantyProvider.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create warranty');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Add Warranty" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Roof Warranty, HVAC Compressor"
          />

          {/* Job Picker */}
          <Text style={styles.sectionLabel}>Job *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.jobScrollContainer}
            contentContainerStyle={styles.jobChipRow}
          >
            {jobs.map((job) => {
              const active = selectedJobId === job.id;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.jobChip,
                    active && styles.jobChipActive,
                  ]}
                  onPress={() => setSelectedJobId(job.id)}
                >
                  <Text
                    style={[
                      styles.jobChipText,
                      active && styles.jobChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {job.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {jobs.length === 0 && (
              <Text style={styles.noJobsText}>No active jobs found</Text>
            )}
          </ScrollView>

          <DatePickerField
            label="Start Date *"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select warranty start date"
          />

          <DatePickerField
            label="End Date *"
            value={endDate}
            onChange={setEndDate}
            placeholder="Select warranty end date"
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What does this warranty cover?"
            multiline
            numberOfLines={3}
          />

          <Input
            label="Manufacturer"
            value={manufacturer}
            onChangeText={setManufacturer}
            placeholder="e.g. Carrier, Owens Corning"
          />

          <Input
            label="Warranty Provider"
            value={warrantyProvider}
            onChangeText={setWarrantyProvider}
            placeholder="e.g. ABC Roofing Co."
          />

          <Input
            label="Contact Phone"
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="e.g. (555) 123-4567"
            keyboardType="phone-pad"
          />

          <Input
            label="Contact Email"
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="e.g. support@provider.com"
            keyboardType="email-address"
            autoCapitalize="none"
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
            title="Save Warranty"
            onPress={handleSubmit}
            loading={createWarranty.isPending}
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
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    jobScrollContainer: {
      marginBottom: spacing.lg,
    },
    jobChipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    jobChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    jobChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    jobChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      maxWidth: 150,
    },
    jobChipTextActive: {
      color: colors.white,
    },
    noJobsText: {
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
