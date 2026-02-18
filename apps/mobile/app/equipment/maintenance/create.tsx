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
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import { useCreateMaintenanceLog } from '../../../src/hooks/useEquipment';
import { dollarsToCents } from '../../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

const MAINTENANCE_TYPES = [
  { value: 'INSPECTION', label: 'Inspection', icon: 'eye-outline' as const },
  { value: 'REPAIR', label: 'Repair', icon: 'build-outline' as const },
  { value: 'SERVICING', label: 'Servicing', icon: 'settings-outline' as const },
  { value: 'CALIBRATION', label: 'Calibration', icon: 'speedometer-outline' as const },
  { value: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal-outline' as const },
];

export default function CreateMaintenanceLogScreen() {
  const router = useRouter();
  const { equipmentId, equipmentName } = useLocalSearchParams<{
    equipmentId: string;
    equipmentName?: string;
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createLog = useCreateMaintenanceLog();

  const [type, setType] = useState('INSPECTION');
  const [description, setDescription] = useState('');
  const [performedAt, setPerformedAt] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [costStr, setCostStr] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit = !!equipmentId && !!type && !!performedAt;

  const handleSubmit = async () => {
    if (!equipmentId) {
      setError('Equipment is required');
      return;
    }
    if (!type) {
      setError('Type is required');
      return;
    }
    if (!performedAt) {
      setError('Performed date is required');
      return;
    }
    setError('');

    const cost = costStr
      ? dollarsToCents(parseFloat(costStr))
      : undefined;

    try {
      await createLog.mutateAsync({
        equipmentId,
        type,
        description: description.trim() || undefined,
        performedAt,
        cost: cost && !isNaN(cost) ? cost : undefined,
        nextDueDate: nextDueDate || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create maintenance log',
      );
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Log Maintenance" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Equipment name */}
          {equipmentName && (
            <View style={styles.equipmentBanner}>
              <Ionicons
                name="construct-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.equipmentNameText}>
                {decodeURIComponent(equipmentName)}
              </Text>
            </View>
          )}

          {/* Type picker */}
          <Text style={styles.sectionLabel}>Type *</Text>
          <View style={styles.typeGrid}>
            {MAINTENANCE_TYPES.map((mt) => {
              const active = type === mt.value;
              return (
                <TouchableOpacity
                  key={mt.value}
                  style={[
                    styles.typeChip,
                    active && {
                      backgroundColor: colors.warning,
                      borderColor: colors.warning,
                    },
                  ]}
                  onPress={() => setType(mt.value)}
                >
                  <Ionicons
                    name={mt.icon}
                    size={16}
                    color={active ? colors.white : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      active && styles.typeChipTextActive,
                    ]}
                  >
                    {mt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What was done..."
            multiline
            numberOfLines={3}
          />

          {/* Performed date */}
          <DatePickerField
            label="Performed Date *"
            value={performedAt}
            onChange={setPerformedAt}
            placeholder="Select date"
          />

          {/* Cost */}
          <Input
            label="Cost ($)"
            value={costStr}
            onChangeText={setCostStr}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          {/* Next due date */}
          <DatePickerField
            label="Next Due Date"
            value={nextDueDate}
            onChange={setNextDueDate}
            placeholder="Select next maintenance date (optional)"
          />

          {/* Notes */}
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
            title="Save Maintenance Log"
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
    equipmentBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary + '10',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    equipmentNameText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    typeChip: {
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
    typeChipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    typeChipTextActive: {
      color: colors.white,
      fontWeight: '600',
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
