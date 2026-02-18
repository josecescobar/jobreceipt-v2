import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Card } from '../../src/components/ui';
import { useGenerateReport } from '../../src/hooks/useReports';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';
type ReportFormat = 'pdf' | 'csv';

interface DateRange {
  start: string;
  end: string;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

function computeDateRange(preset: DatePreset): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (preset) {
    case 'this_month': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { start: toDateString(start), end: toDateString(end) };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start: toDateString(start), end: toDateString(end) };
    }
    case 'this_quarter': {
      const quarterStart = Math.floor(month / 3) * 3;
      const start = new Date(year, quarterStart, 1);
      const end = new Date(year, quarterStart + 3, 0);
      return { start: toDateString(start), end: toDateString(end) };
    }
    case 'this_year': {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { start: toDateString(start), end: toDateString(end) };
    }
    case 'custom':
    default: {
      // Default to this month for custom until user edits
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { start: toDateString(start), end: toDateString(end) };
    }
  }
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

export default function ReportGenerateScreen() {
  const { type, label } = useLocalSearchParams<{ type: string; label: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const generateReport = useGenerateReport();

  const [title, setTitle] = useState(label ?? 'Report');
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [customStart, setCustomStart] = useState(() => computeDateRange('this_month').start);
  const [customEnd, setCustomEnd] = useState(() => computeDateRange('this_month').end);
  const [format, setFormat] = useState<ReportFormat>('pdf');

  const dateRange = useMemo((): DateRange => {
    if (preset === 'custom') {
      return { start: customStart, end: customEnd };
    }
    return computeDateRange(preset);
  }, [preset, customStart, customEnd]);

  const handlePresetPress = useCallback((value: DatePreset) => {
    Haptics.selectionAsync();
    setPreset(value);
    if (value !== 'custom') {
      const range = computeDateRange(value);
      setCustomStart(range.start);
      setCustomEnd(range.end);
    }
  }, []);

  const handleFormatPress = useCallback((f: ReportFormat) => {
    Haptics.selectionAsync();
    setFormat(f);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a report title.');
      return;
    }
    if (preset === 'custom') {
      if (!isValidDateString(customStart) || !isValidDateString(customEnd)) {
        Alert.alert('Invalid Date', 'Please enter valid dates in YYYY-MM-DD format.');
        return;
      }
      if (customStart > customEnd) {
        Alert.alert('Invalid Range', 'Start date must be before end date.');
        return;
      }
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await generateReport.mutateAsync({
        type: type ?? '',
        title: title.trim(),
        dateRange,
        format,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Report Failed', err.message || 'Could not generate the report.');
    }
  }, [title, type, dateRange, format, preset, customStart, customEnd, generateReport]);

  return (
    <Screen padded={false}>
      <Header title={label ?? 'Generate Report'} showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Report Type Badge */}
          <View style={styles.typeBadge}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.typeBadgeText}>{label}</Text>
          </View>

          {/* Title Input */}
          <Text style={styles.sectionLabel}>Report Title</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter report title"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
              returnKeyType="done"
            />
          </View>

          {/* Date Range Presets */}
          <Text style={styles.sectionLabel}>Date Range</Text>
          <View style={styles.presetRow}>
            {DATE_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.presetChip, preset === p.value && styles.presetChipActive]}
                onPress={() => handlePresetPress(p.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    preset === p.value && styles.presetChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom date inputs */}
          {preset === 'custom' && (
            <Card style={styles.customDateCard}>
              <View style={styles.customDateRow}>
                <View style={styles.customDateField}>
                  <Text style={styles.customDateLabel}>Start</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={customStart}
                      onChangeText={setCustomStart}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View style={styles.customDateField}>
                  <Text style={styles.customDateLabel}>End</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={customEnd}
                      onChangeText={setCustomEnd}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Date range summary */}
          {preset !== 'custom' && (
            <View style={styles.dateRangeSummary}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dateRangeText}>
                {dateRange.start} to {dateRange.end}
              </Text>
            </View>
          )}

          {/* Job Filter */}
          <Text style={styles.sectionLabel}>Jobs</Text>
          <View style={styles.jobFilterRow}>
            <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
            <Text style={styles.jobFilterText}>All Jobs</Text>
          </View>

          {/* Format Toggle */}
          <Text style={styles.sectionLabel}>Format</Text>
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatButton, format === 'pdf' && styles.formatButtonActive]}
              onPress={() => handleFormatPress('pdf')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-outline"
                size={20}
                color={format === 'pdf' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.formatButtonText,
                  format === 'pdf' && styles.formatButtonTextActive,
                ]}
              >
                PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatButton, format === 'csv' && styles.formatButtonActive]}
              onPress={() => handleFormatPress('csv')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={format === 'csv' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.formatButtonText,
                  format === 'csv' && styles.formatButtonTextActive,
                ]}
              >
                CSV
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Generate Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.generateButton, generateReport.isPending && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={generateReport.isPending}
            activeOpacity={0.8}
          >
            {generateReport.isPending ? (
              <View style={styles.generateLoading}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </View>
            ) : (
              <View style={styles.generateContent}>
                <Ionicons name="download-outline" size={20} color={colors.white} />
                <Text style={styles.generateButtonText}>Generate Report</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
      paddingBottom: spacing.xxl,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      marginBottom: spacing.xl,
    },
    typeBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    inputWrapper: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textInput: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    presetChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetChipTextActive: {
      color: colors.white,
    },
    customDateCard: {
      marginTop: spacing.md,
      padding: spacing.md,
    },
    customDateRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    customDateField: {
      flex: 1,
    },
    customDateLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    dateRangeSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
    },
    dateRangeText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    jobFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    jobFilterText: {
      fontSize: 16,
      color: colors.text,
    },
    formatRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    formatButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formatButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    formatButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    formatButtonTextActive: {
      color: colors.white,
    },
    bottomSpacer: {
      height: spacing.xxl,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    generateButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    generateButtonDisabled: {
      opacity: 0.6,
    },
    generateLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    generateContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    generateButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
  });
