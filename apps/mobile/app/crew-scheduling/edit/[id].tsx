import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, LoadingScreen } from '../../../src/components/ui';
import {
  useCrewAssignment,
  useUpdateCrewAssignment,
  useDeleteCrewAssignment,
} from '../../../src/hooks/useCrewScheduling';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';
import { CrewAssignmentStatus } from '@jobreceipt/shared';

const STATUSES: { value: CrewAssignmentStatus; label: string; colorKey: 'primary' | 'success' | 'error' }[] = [
  { value: CrewAssignmentStatus.SCHEDULED, label: 'Scheduled', colorKey: 'primary' },
  { value: CrewAssignmentStatus.COMPLETED, label: 'Completed', colorKey: 'success' },
  { value: CrewAssignmentStatus.NO_SHOW, label: 'No Show', colorKey: 'error' },
];

export default function EditCrewAssignmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: assignment, isLoading } = useCrewAssignment(id);
  const updateAssignment = useUpdateCrewAssignment();
  const deleteAssignment = useDeleteCrewAssignment();

  const [status, setStatus] = useState<CrewAssignmentStatus>(CrewAssignmentStatus.SCHEDULED);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (assignment) {
      setStatus(assignment.status);
      setStartTime(assignment.startTime ?? '');
      setEndTime(assignment.endTime ?? '');
      setNotes(assignment.notes ?? '');
    }
  }, [assignment]);

  const handleSave = async () => {
    setError('');
    try {
      await updateAssignment.mutateAsync({
        id,
        updates: {
          status,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          notes: notes || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update assignment');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Assignment', 'Are you sure you want to delete this crew assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAssignment.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete assignment');
          }
        },
      },
    ]);
  };

  if (isLoading || !assignment) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Edit Assignment" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Read-only info */}
          <View style={styles.readOnlyCard}>
            <View style={styles.readOnlyRow}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.readOnlyText}>{assignment.job?.name ?? 'Unknown Job'}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.readOnlyText}>{assignment.user?.name ?? 'Unnamed'}</Text>
            </View>
          </View>

          {/* Status */}
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => {
              const isActive = status === s.value;
              const statusColor = colors[s.colorKey];
              return (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.statusChip,
                    isActive && { backgroundColor: statusColor + '20', borderColor: statusColor },
                  ]}
                  onPress={() => setStatus(s.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      isActive && { color: statusColor },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Range */}
          <Text style={styles.sectionLabel}>Time Range</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Input
                label="Start Time"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
              />
            </View>
            <Text style={styles.timeSeparator}>-</Text>
            <View style={styles.timeField}>
              <Input
                label="End Time"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
              />
            </View>
          </View>

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Special instructions, equipment needed..."
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={updateAssignment.isPending}
          />

          <View style={styles.deleteWrap}>
            <Button
              title="Delete Assignment"
              onPress={handleDelete}
              variant="danger"
              loading={deleteAssignment.isPending}
            />
          </View>
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
    readOnlyCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    readOnlyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    readOnlyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    statusRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statusChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statusChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    timeField: {
      flex: 1,
    },
    timeSeparator: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textMuted,
      marginHorizontal: spacing.sm,
      paddingTop: spacing.lg,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    deleteWrap: {
      marginTop: spacing.lg,
    },
  });
