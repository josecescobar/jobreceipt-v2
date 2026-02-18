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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button } from '../../src/components/ui';
import {
  useSafetyTemplates,
  useCreateInspection,
} from '../../src/hooks/useSafety';
import { useJobs } from '../../src/hooks/useJobs';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../src/theme';

export default function CreateInspectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createInspection = useCreateInspection();

  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [error, setError] = useState('');

  const { data: templates } = useSafetyTemplates();
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const allJobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  const currentTemplate = templates?.find(
    (t) => t.name === selectedTemplate,
  );
  const canSubmit = !!selectedJobId && !!selectedTemplate;

  const handleSubmit = async () => {
    if (!selectedJobId) {
      setError('Please select a job');
      return;
    }
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }
    setError('');

    try {
      const result = await createInspection.mutateAsync({
        jobId: selectedJobId,
        templateName: selectedTemplate,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/safety/inspection/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create inspection');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Inspection" showBack />
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

          {/* Template Picker */}
          <Text style={styles.label}>Template *</Text>
          <View style={styles.templateGrid}>
            {(templates ?? []).map((template) => {
              const active = selectedTemplate === template.name;
              return (
                <TouchableOpacity
                  key={template.name}
                  style={[
                    styles.templateCard,
                    active && styles.templateCardActive,
                  ]}
                  onPress={() => setSelectedTemplate(template.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color={active ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.templateName,
                      active && styles.templateNameActive,
                    ]}
                    numberOfLines={2}
                  >
                    {template.name}
                  </Text>
                  <Text
                    style={[
                      styles.templateCount,
                      active && styles.templateCountActive,
                    ]}
                  >
                    {template.items.length} items
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Template Preview */}
          {currentTemplate && (
            <View style={styles.previewSection}>
              <Text style={styles.label}>Checklist Preview</Text>
              <View style={styles.previewCard}>
                {currentTemplate.items.map((item, index) => (
                  <View key={index} style={styles.previewItem}>
                    <Ionicons
                      name="checkbox-outline"
                      size={16}
                      color={colors.textMuted}
                    />
                    <Text style={styles.previewText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Start Inspection"
            onPress={handleSubmit}
            loading={createInspection.isPending}
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
    templateGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    templateCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 100,
      justifyContent: 'center',
    },
    templateCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    templateName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    templateNameActive: {
      color: colors.white,
    },
    templateCount: {
      fontSize: 11,
      color: colors.textMuted,
    },
    templateCountActive: {
      color: colors.white + 'CC',
    },
    previewSection: {
      marginBottom: spacing.lg,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    previewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    previewText: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
