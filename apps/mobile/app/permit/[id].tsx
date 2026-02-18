import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Badge, Input, DatePickerField } from '../../src/components/ui';
import {
  usePermit,
  useUpdatePermit,
  useDeletePermit,
  useAddInspection,
  useUpdateInspection,
} from '../../src/hooks/usePermits';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { PermitInspection } from '@jobreceipt/shared';

const PERMIT_TYPE_LABELS: Record<string, string> = {
  BUILDING: 'Building',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  MECHANICAL: 'Mechanical',
  FIRE: 'Fire',
  DEMOLITION: 'Demolition',
  GRADING: 'Grading',
  OTHER: 'Other',
};

const getStatusBadgeStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'APPLIED':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Applied' };
    case 'ISSUED':
      return { bg: colors.success + '20', text: colors.success, label: 'Issued' };
    case 'EXPIRED':
      return { bg: colors.error + '20', text: colors.error, label: 'Expired' };
    case 'REVOKED':
      return { bg: colors.error + '20', text: colors.error, label: 'Revoked' };
    case 'CLOSED':
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: 'Closed' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

const getResultBadgeStyle = (
  result: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (result) {
    case 'PASSED':
      return { bg: colors.success + '20', text: colors.success, label: 'Passed' };
    case 'FAILED':
      return { bg: colors.error + '20', text: colors.error, label: 'Failed' };
    case 'PARTIAL':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Partial' };
    case 'PENDING':
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: 'Pending' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: result };
  }
};

const RESULT_OPTIONS = [
  { key: 'PASSED', label: 'Passed' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'PARTIAL', label: 'Partial' },
] as const;

export default function PermitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: permit, isLoading } = usePermit(id!);
  const updatePermit = useUpdatePermit();
  const deletePermit = useDeletePermit();
  const addInspection = useAddInspection();
  const updateInspection = useUpdateInspection();

  // Inline inspection form state
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspScheduledDate, setInspScheduledDate] = useState('');
  const [inspInspector, setInspInspector] = useState('');
  const [inspNotes, setInspNotes] = useState('');

  // Record result state
  const [recordingInspectionId, setRecordingInspectionId] = useState<string | null>(null);
  const [resultSelection, setResultSelection] = useState<string>('');
  const [resultNotes, setResultNotes] = useState('');

  if (isLoading || !permit) {
    return (
      <Screen padded={false}>
        <Header title="Permit" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusBadgeStyle(permit.status, colors);

  const handleMarkIssued = async () => {
    try {
      await updatePermit.mutateAsync({
        id: permit.id,
        updates: { status: 'ISSUED', issuedDate: new Date().toISOString() },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to update permit status.');
    }
  };

  const handleMarkClosed = async () => {
    try {
      await updatePermit.mutateAsync({
        id: permit.id,
        updates: { status: 'CLOSED' },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to update permit status.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Permit?',
      'This permit and all related inspections will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePermit.mutateAsync(permit.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete permit.');
            }
          },
        },
      ],
    );
  };

  const handleScheduleInspection = async () => {
    if (!inspScheduledDate) {
      Alert.alert('Error', 'Scheduled date is required.');
      return;
    }
    try {
      await addInspection.mutateAsync({
        permitId: permit.id,
        data: {
          scheduledDate: inspScheduledDate,
          inspector: inspInspector.trim() || undefined,
          notes: inspNotes.trim() || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowInspectionForm(false);
      setInspScheduledDate('');
      setInspInspector('');
      setInspNotes('');
    } catch {
      Alert.alert('Error', 'Failed to schedule inspection.');
    }
  };

  const handleRecordResult = async (inspectionId: string) => {
    if (!resultSelection) {
      Alert.alert('Error', 'Please select a result.');
      return;
    }
    try {
      await updateInspection.mutateAsync({
        inspectionId,
        permitId: permit.id,
        data: {
          result: resultSelection,
          completedDate: new Date().toISOString(),
          notes: resultNotes.trim() || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRecordingInspectionId(null);
      setResultSelection('');
      setResultNotes('');
    } catch {
      Alert.alert('Error', 'Failed to record inspection result.');
    }
  };

  const inspections: PermitInspection[] = permit.inspections ?? [];

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Permit Details" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <Badge
            label={statusStyle.label}
            color={statusStyle.text}
            backgroundColor={statusStyle.bg}
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          {permit.permitNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Permit Number</Text>
              <Text style={styles.infoValue}>{permit.permitNumber}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {PERMIT_TYPE_LABELS[permit.type] ?? permit.type}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.inlineStatusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.inlineStatusText, { color: statusStyle.text }]}>
                {statusStyle.label}
              </Text>
            </View>
          </View>
          {permit.job?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job</Text>
              <Text style={styles.infoValue}>{permit.job.name}</Text>
            </View>
          )}
          {permit.appliedDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Applied Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(permit.appliedDate)}
              </Text>
            </View>
          )}
          {permit.issuedDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issued Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(permit.issuedDate)}
              </Text>
            </View>
          )}
          {permit.expiresAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expires</Text>
              <Text style={styles.infoValue}>
                {formatDate(permit.expiresAt)}
              </Text>
            </View>
          )}
          {permit.authority && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Authority</Text>
              <Text style={styles.infoValue}>{permit.authority}</Text>
            </View>
          )}
          {permit.fee != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fee</Text>
              <Text style={styles.infoValue}>
                {formatMoney(permit.fee)}
              </Text>
            </View>
          )}
          {permit.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{permit.notes}</Text>
            </View>
          )}
        </View>

        {/* Status Actions */}
        {permit.status === 'APPLIED' && (
          <View style={styles.actionRow}>
            <Button
              title="Mark as Issued"
              onPress={handleMarkIssued}
              loading={updatePermit.isPending}
            />
          </View>
        )}
        {permit.status === 'ISSUED' && (
          <View style={styles.actionRow}>
            <Button
              title="Mark as Closed"
              onPress={handleMarkClosed}
              loading={updatePermit.isPending}
              variant="secondary"
            />
          </View>
        )}

        {/* Inspections Section */}
        <View style={styles.inspectionHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Inspections ({inspections.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowInspectionForm(!showInspectionForm)}
            style={styles.addBtn}
          >
            <Ionicons
              name={showInspectionForm ? 'close-circle' : 'add-circle'}
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Inline Schedule Inspection Form */}
        {showInspectionForm && (
          <View style={styles.inlineForm}>
            <DatePickerField
              label="Scheduled Date *"
              value={inspScheduledDate}
              onChange={setInspScheduledDate}
              placeholder="Select inspection date"
            />
            <Input
              label="Inspector"
              value={inspInspector}
              onChangeText={setInspInspector}
              placeholder="Inspector name (optional)"
            />
            <Input
              label="Notes"
              value={inspNotes}
              onChangeText={setInspNotes}
              placeholder="Notes (optional)"
              multiline
              numberOfLines={2}
            />
            <Button
              title="Schedule Inspection"
              onPress={handleScheduleInspection}
              loading={addInspection.isPending}
              disabled={!inspScheduledDate}
            />
          </View>
        )}

        {/* Inspections List */}
        {inspections.length > 0 ? (
          <View style={styles.inspectionList}>
            {inspections.map((inspection) => {
              const resultStyle = getResultBadgeStyle(inspection.result, colors);
              const isRecording = recordingInspectionId === inspection.id;
              return (
                <View key={inspection.id} style={styles.inspectionCard}>
                  <View style={styles.inspectionTop}>
                    <Text style={styles.inspectionDate}>
                      {formatDate(inspection.scheduledDate)}
                    </Text>
                    <View
                      style={[
                        styles.resultBadge,
                        { backgroundColor: resultStyle.bg },
                      ]}
                    >
                      <Text style={[styles.resultBadgeText, { color: resultStyle.text }]}>
                        {resultStyle.label}
                      </Text>
                    </View>
                  </View>
                  {inspection.inspector && (
                    <Text style={styles.inspectorText}>
                      Inspector: {inspection.inspector}
                    </Text>
                  )}
                  {inspection.completedDate && (
                    <Text style={styles.completedText}>
                      Completed: {formatDate(inspection.completedDate)}
                    </Text>
                  )}
                  {inspection.notes && (
                    <Text style={styles.inspectionNotes}>{inspection.notes}</Text>
                  )}

                  {/* Record Result for PENDING inspections */}
                  {inspection.result === 'PENDING' && !isRecording && (
                    <TouchableOpacity
                      style={styles.recordResultBtn}
                      onPress={() => {
                        setRecordingInspectionId(inspection.id);
                        setResultSelection('');
                        setResultNotes('');
                      }}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                      <Text style={styles.recordResultText}>Record Result</Text>
                    </TouchableOpacity>
                  )}

                  {/* Inline Record Result Form */}
                  {isRecording && (
                    <View style={styles.recordForm}>
                      <Text style={styles.recordFormLabel}>Result</Text>
                      <View style={styles.resultChipRow}>
                        {RESULT_OPTIONS.map((opt) => {
                          const active = resultSelection === opt.key;
                          return (
                            <TouchableOpacity
                              key={opt.key}
                              style={[
                                styles.resultChip,
                                active && styles.resultChipActive,
                              ]}
                              onPress={() => setResultSelection(opt.key)}
                            >
                              <Text
                                style={[
                                  styles.resultChipText,
                                  active && styles.resultChipTextActive,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <Input
                        label="Notes"
                        value={resultNotes}
                        onChangeText={setResultNotes}
                        placeholder="Inspection notes (optional)"
                        multiline
                        numberOfLines={2}
                      />
                      <View style={styles.recordFormActions}>
                        <Button
                          title="Cancel"
                          onPress={() => setRecordingInspectionId(null)}
                          variant="ghost"
                        />
                        <Button
                          title="Save Result"
                          onPress={() => handleRecordResult(inspection.id)}
                          loading={updateInspection.isPending}
                          disabled={!resultSelection}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No inspections scheduled yet — tap + to add one
          </Text>
        )}

        {/* Delete button */}
        <View style={styles.dangerZone}>
          <Button
            title="Delete Permit"
            onPress={handleDelete}
            variant="ghost"
            loading={deletePermit.isPending}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },
    statusRow: {
      marginBottom: spacing.lg,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 13,
      color: colors.textMuted,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      flex: 2,
      textAlign: 'right',
    },
    typeBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    typeBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    inlineStatusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    inlineStatusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    actionRow: {
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    inspectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    addBtn: {
      padding: spacing.xs,
    },
    inlineForm: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    inspectionList: {
      gap: spacing.sm,
    },
    inspectionCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inspectionTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    inspectionDate: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    resultBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    resultBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    inspectorText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    completedText: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    inspectionNotes: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    recordResultBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
    },
    recordResultText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    recordForm: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    recordFormLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    resultChipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    resultChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    resultChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    resultChipTextActive: {
      color: colors.white,
    },
    recordFormActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    dangerZone: {
      marginTop: spacing.xl,
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
