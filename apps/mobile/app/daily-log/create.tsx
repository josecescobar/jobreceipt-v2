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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateDailyLog } from '../../src/hooks/useDailyLogs';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const WEATHER_OPTIONS = [
  { value: 'SUNNY', label: 'Sunny', icon: 'sunny-outline' as const },
  { value: 'CLOUDY', label: 'Cloudy', icon: 'cloud-outline' as const },
  { value: 'RAINY', label: 'Rainy', icon: 'rainy-outline' as const },
  { value: 'SNOWY', label: 'Snowy', icon: 'snow-outline' as const },
  { value: 'WINDY', label: 'Windy', icon: 'flag-outline' as const },
] as const;

export default function CreateDailyLogScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createLog = useCreateDailyLog();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<string>('');
  const [temperature, setTemperature] = useState('');
  const [crewCount, setCrewCount] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit = !!jobId && workPerformed.trim().length > 0;

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Job is required');
      return;
    }
    if (!workPerformed.trim()) {
      setError('Work performed is required');
      return;
    }
    setError('');

    try {
      await createLog.mutateAsync({
        jobId,
        date,
        weather: weather || undefined,
        temperature: temperature ? parseInt(temperature, 10) : undefined,
        crewCount: crewCount ? parseInt(crewCount, 10) : undefined,
        workPerformed: workPerformed.trim(),
        materialsUsed: materialsUsed.trim() || undefined,
        safetyNotes: safetyNotes.trim() || undefined,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create daily log');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Add Daily Log" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <DatePickerField label="Date" value={date} onChange={setDate} />

          {/* Weather */}
          <Text style={styles.sectionLabel}>Weather</Text>
          <View style={styles.weatherGrid}>
            {WEATHER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.weatherChip,
                  weather === opt.value && styles.weatherChipActive,
                ]}
                onPress={() =>
                  setWeather(weather === opt.value ? '' : opt.value)
                }
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={weather === opt.value ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.weatherChipText,
                    weather === opt.value && styles.weatherChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Temperature */}
          <Input
            label="Temperature (°F)"
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="number-pad"
            placeholder="e.g. 72"
          />

          {/* Crew Count */}
          <Input
            label="Crew Count"
            value={crewCount}
            onChangeText={setCrewCount}
            keyboardType="number-pad"
            placeholder="e.g. 5"
          />

          {/* Work Performed */}
          <Input
            label="Work Performed *"
            value={workPerformed}
            onChangeText={setWorkPerformed}
            placeholder="Describe the work done today..."
            multiline
            numberOfLines={4}
          />

          {/* Materials Used */}
          <Input
            label="Materials Used"
            value={materialsUsed}
            onChangeText={setMaterialsUsed}
            placeholder="List materials used..."
            multiline
            numberOfLines={3}
          />

          {/* Safety Notes */}
          <Input
            label="Safety Notes"
            value={safetyNotes}
            onChangeText={setSafetyNotes}
            placeholder="Any safety observations or incidents..."
            multiline
            numberOfLines={3}
          />

          {/* Hours Worked */}
          <Input
            label="Hours Worked"
            value={hoursWorked}
            onChangeText={setHoursWorked}
            keyboardType="decimal-pad"
            placeholder="e.g. 8.5"
          />

          {/* Notes */}
          <Input
            label="Additional Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Daily Log"
            onPress={handleSubmit}
            loading={createLog.isPending}
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
    weatherGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    weatherChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    weatherChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    weatherChipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    weatherChipTextActive: {
      color: colors.white,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
