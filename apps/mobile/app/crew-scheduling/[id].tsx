import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, LoadingScreen } from '../../src/components/ui';
import {
  useCrewAssignment,
  useUpdateCrewAssignment,
  useDeleteCrewAssignment,
} from '../../src/hooks/useCrewScheduling';
import { formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { CrewAssignmentStatus } from '@jobreceipt/shared';

const STATUS_CONFIG: Record<CrewAssignmentStatus, { label: string; colorKey: 'primary' | 'success' | 'error' }> = {
  SCHEDULED: { label: 'Scheduled', colorKey: 'primary' },
  COMPLETED: { label: 'Completed', colorKey: 'success' },
  NO_SHOW: { label: 'No Show', colorKey: 'error' },
};

export default function CrewAssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: assignment, isLoading } = useCrewAssignment(id);
  const updateAssignment = useUpdateCrewAssignment();
  const deleteAssignment = useDeleteCrewAssignment();

  const handleMarkComplete = async () => {
    try {
      await updateAssignment.mutateAsync({ id, updates: { status: 'COMPLETED' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update assignment');
    }
  };

  const handleMarkNoShow = async () => {
    try {
      await updateAssignment.mutateAsync({ id, updates: { status: 'NO_SHOW' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update assignment');
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
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete assignment');
          }
        },
      },
    ]);
  };

  if (isLoading || !assignment) return <LoadingScreen />;

  const config = STATUS_CONFIG[assignment.status];
  const statusColor = colors[config.colorKey];
  const isScheduled = assignment.status === 'SCHEDULED';

  return (
    <Screen padded={false}>
      <Header title="Assignment Details" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{config.label}</Text>
          </View>
        </View>

        {/* Job */}
        <Text style={styles.label}>Job</Text>
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => router.push(`/job/${assignment.jobId}`)}
          activeOpacity={0.7}
        >
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
            <Text style={styles.infoValue}>{assignment.job?.name ?? 'Unknown Job'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Crew Member */}
        <Text style={styles.label}>Crew Member</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoValue}>{assignment.user?.name ?? 'Unnamed'}</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.infoValue}>{formatDate(assignment.date)}</Text>
          </View>
        </View>

        {/* Time Range */}
        {(assignment.startTime || assignment.endTime) && (
          <>
            <Text style={styles.label}>Time</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoValue}>
                  {assignment.startTime ?? '--:--'} - {assignment.endTime ?? '--:--'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        {assignment.notes && (
          <>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{assignment.notes}</Text>
            </View>
          </>
        )}

        {/* Status Actions */}
        {isScheduled && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}
              onPress={handleMarkComplete}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.actionBtnText, { color: colors.success }]}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}
              onPress={handleMarkNoShow}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>Mark No-Show</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit / Delete */}
        <View style={styles.bottomActions}>
          <Button
            title="Edit Assignment"
            onPress={() => router.push(`/crew-scheduling/edit/${id}`)}
          />
          <View style={styles.deleteSpacer} />
          <Button
            title="Delete Assignment"
            onPress={handleDelete}
            variant="danger"
            loading={deleteAssignment.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    statusRow: {
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    infoValue: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    notesText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
    },
    bottomActions: {
      marginTop: spacing.xl,
    },
    deleteSpacer: {
      height: spacing.md,
    },
  });
