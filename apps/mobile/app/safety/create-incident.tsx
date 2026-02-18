import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateIncident } from '../../src/hooks/useSafety';
import { useJobs } from '../../src/hooks/useJobs';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../src/theme';

const INCIDENT_TYPES = [
  { key: 'INJURY', label: 'Injury' },
  { key: 'NEAR_MISS', label: 'Near Miss' },
  { key: 'PROPERTY_DAMAGE', label: 'Property Damage' },
  { key: 'ENVIRONMENTAL', label: 'Environmental' },
  { key: 'OTHER', label: 'Other' },
] as const;

const SEVERITY_LEVELS = [
  { key: 'LOW', label: 'Low', color: 'textMuted' },
  { key: 'MEDIUM', label: 'Medium', color: 'warning' },
  { key: 'HIGH', label: 'High', color: 'error' },
  { key: 'CRITICAL', label: 'Critical', color: 'error' },
] as const;

export default function CreateIncidentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createIncident = useCreateIncident();

  const [selectedJobId, setSelectedJobId] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [error, setError] = useState('');

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const allJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const canSubmit =
    !!selectedJobId &&
    !!incidentDate &&
    !!selectedType &&
    !!selectedSeverity &&
    title.trim().length > 0 &&
    description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');

    try {
      await createIncident.mutateAsync({
        jobId: selectedJobId,
        incidentDate,
        type: selectedType,
        severity: selectedSeverity,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        witnesses: witnesses.trim() || undefined,
        actionTaken: actionTaken.trim() || undefined,
        followUp: followUp.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report incident');
    }
  };

  const getSeverityChipColor = (colorKey: string) => {
    switch (colorKey) {
      case 'textMuted':
        return colors.textMuted;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Report Incident" showBack />
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
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {job.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date Picker */}
          <DatePickerField
            label="Incident Date *"
            value={incidentDate}
            onChange={setIncidentDate}
            placeholder="Select date of incident"
          />

          {/* Type Picker */}
          <Text style={styles.label}>Incident Type *</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map((t) => {
              const active = selectedType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      active && styles.typeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Severity Picker */}
          <Text style={styles.label}>Severity *</Text>
          <View style={styles.typeGrid}>
            {SEVERITY_LEVELS.map((s) => {
              const active = selectedSeverity === s.key;
              const chipColor = getSeverityChipColor(s.color);
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.severityChip,
                    { borderColor: active ? chipColor : colors.border },
                    active && { backgroundColor: chipColor + '20' },
                  ]}
                  onPress={() => setSelectedSeverity(s.key)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      active && { color: chipColor, fontWeight: '700' },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="Brief title of the incident"
          />

          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened in detail..."
            multiline
            numberOfLines={4}
          />

          <Input
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="Where did the incident occur?"
          />

          <Input
            label="Witnesses"
            value={witnesses}
            onChangeText={setWitnesses}
            placeholder="Names of any witnesses"
          />

          <Input
            label="Action Taken"
            value={actionTaken}
            onChangeText={setActionTaken}
            placeholder="Immediate actions taken..."
            multiline
            numberOfLines={3}
          />

          <Input
            label="Follow Up"
            value={followUp}
            onChangeText={setFollowUp}
            placeholder="Required follow-up actions..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Submit Report"
            onPress={handleSubmit}
            loading={createIncident.isPending}
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
    severityChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
