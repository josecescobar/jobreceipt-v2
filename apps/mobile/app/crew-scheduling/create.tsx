import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateCrewAssignment } from '../../src/hooks/useCrewScheduling';
import { useJobs } from '../../src/hooks/useJobs';
import { organizationsApi, type OrgMember } from '../../src/api/organizations';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CreateCrewAssignmentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const orgId = useAuthStore((s) => s.organizationId);
  const createAssignment = useCreateCrewAssignment();

  // Job picker
  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(() => jobsData?.pages?.flatMap((p) => p.data) ?? [], [jobsData]);
  const [jobId, setJobId] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const selectedJob = jobs.find((j) => j.id === jobId);

  // Member picker
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [userId, setUserId] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const selectedMember = members.find((m) => m.userId === userId);

  const loadMembers = useCallback(async () => {
    if (!orgId || membersLoaded) return;
    try {
      const data = await organizationsApi.getMembers(orgId);
      setMembers(data);
      setMembersLoaded(true);
    } catch {
      // Silently handle
    }
  }, [orgId, membersLoaded]);

  const handleOpenMemberModal = useCallback(() => {
    loadMembers();
    setShowMemberModal(true);
  }, [loadMembers]);

  // Date
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Times
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');

  const canSubmit = jobId && userId && date;

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Please select a job');
      return;
    }
    if (!userId) {
      setError('Please select a crew member');
      return;
    }
    setError('');

    try {
      const result = await createAssignment.mutateAsync({
        jobId,
        userId,
        dates: [date],
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        notes: notes || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Assign Crew" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job Selection */}
          <Text style={styles.sectionLabel}>Job *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowJobModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="briefcase-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.pickerText, !selectedJob && styles.pickerPlaceholder]}>
              {selectedJob?.name ?? 'Select a job'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Member Selection */}
          <Text style={styles.sectionLabel}>Crew Member *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={handleOpenMemberModal}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.pickerText, !selectedMember && styles.pickerPlaceholder]}>
              {selectedMember ? (selectedMember.user?.name || selectedMember.user?.email) : 'Select a crew member'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Date */}
          <DatePickerField
            label="Date *"
            value={date}
            onChange={setDate}
          />

          {/* Time Range */}
          <Text style={styles.sectionLabel}>Time Range (optional)</Text>
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
            title="Assign Crew"
            onPress={handleSubmit}
            loading={createAssignment.isPending}
            disabled={!canSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Job Selection Modal */}
      <Modal
        visible={showJobModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJobModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Job</Text>
            <TouchableOpacity onPress={() => setShowJobModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, jobId === item.id && styles.modalItemActive]}
                onPress={() => {
                  setJobId(item.id);
                  setShowJobModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalItemText, jobId === item.id && styles.modalItemTextActive]}>
                  {item.name}
                </Text>
                {item.customerName && (
                  <Text style={styles.modalItemSub}>{item.customerName}</Text>
                )}
                {jobId === item.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No active jobs found</Text>
            }
          />
        </View>
      </Modal>

      {/* Member Selection Modal */}
      <Modal
        visible={showMemberModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Crew Member</Text>
            <TouchableOpacity onPress={() => setShowMemberModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = userId === item.userId;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  onPress={() => {
                    setUserId(item.userId);
                    setShowMemberModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberModalInfo}>
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {item.user?.name || 'Unnamed'}
                    </Text>
                    <Text style={styles.modalItemSub}>{item.user?.email} - {item.role}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No members found</Text>
            }
          />
        </View>
      </Modal>
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
    pickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    pickerText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    pickerPlaceholder: {
      color: colors.textMuted,
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
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    modalList: {
      padding: spacing.lg,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    modalItemText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    modalItemTextActive: {
      color: colors.primary,
    },
    modalItemSub: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    memberModalInfo: {
      flex: 1,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
  });
