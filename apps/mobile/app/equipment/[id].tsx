import React, { useMemo } from 'react';
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
import { Button, Badge } from '../../src/components/ui';
import {
  useEquipment,
  useDeleteEquipment,
  useCheckInEquipment,
  useUpdateEquipment,
} from '../../src/hooks/useEquipment';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const getStatusBadgeStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'AVAILABLE':
      return { bg: colors.success + '20', text: colors.success, label: 'Available' };
    case 'IN_USE':
      return { bg: colors.primary + '20', text: colors.primary, label: 'In Use' };
    case 'MAINTENANCE':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Maintenance' };
    case 'RETIRED':
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: 'Retired' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  INSPECTION: 'Inspection',
  REPAIR: 'Repair',
  SERVICING: 'Servicing',
  CALIBRATION: 'Calibration',
  OTHER: 'Other',
};

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: equipment, isLoading } = useEquipment(id!);
  const deleteEquipment = useDeleteEquipment();
  const checkIn = useCheckInEquipment();
  const updateEquipment = useUpdateEquipment();

  if (isLoading || !equipment) {
    return (
      <Screen padded={false}>
        <Header title="Equipment" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusBadgeStyle(equipment.status, colors);

  // Active assignment is the first one where checkedInAt is null
  const activeAssignment = equipment.assignments?.find(
    (a) => !a.checkedInAt,
  );
  const pastAssignments =
    equipment.assignments?.filter((a) => a.checkedInAt) ?? [];

  const handleCheckIn = () => {
    if (!activeAssignment) return;
    Alert.alert(
      'Check In Equipment?',
      `Check in "${equipment.name}" from ${activeAssignment.job?.name ?? 'job'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            try {
              await checkIn.mutateAsync({
                assignmentId: activeAssignment.id,
                equipmentId: equipment.id,
                jobId: activeAssignment.jobId,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to check in equipment.');
            }
          },
        },
      ],
    );
  };

  const handleMarkAvailable = async () => {
    try {
      await updateEquipment.mutateAsync({
        id: equipment.id,
        updates: { status: 'AVAILABLE' },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to update equipment status.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Equipment?',
      `"${equipment.name}" and all related data will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEquipment.mutateAsync(equipment.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete equipment.');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title={equipment.name}
        showBack
        rightAction={{
          icon: 'create-outline',
          onPress: () => router.push(`/equipment/create?editId=${id}`),
        }}
      />

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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{equipment.name}</Text>
          </View>
          {equipment.type && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{equipment.type}</Text>
            </View>
          )}
          {equipment.make && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Make</Text>
              <Text style={styles.infoValue}>{equipment.make}</Text>
            </View>
          )}
          {equipment.model && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{equipment.model}</Text>
            </View>
          )}
          {equipment.serialNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Serial Number</Text>
              <Text style={styles.infoValue}>{equipment.serialNumber}</Text>
            </View>
          )}
          {equipment.purchaseDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(equipment.purchaseDate)}
              </Text>
            </View>
          )}
          {equipment.purchaseCost != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Cost</Text>
              <Text style={styles.infoValue}>
                {formatMoney(equipment.purchaseCost)}
              </Text>
            </View>
          )}
          {equipment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{equipment.notes}</Text>
            </View>
          )}
        </View>

        {/* Active Assignment */}
        {activeAssignment && (
          <>
            <Text style={styles.sectionTitle}>Current Assignment</Text>
            <View style={styles.assignmentCard}>
              <View style={styles.assignmentInfo}>
                <View style={styles.assignmentRow}>
                  <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                  <Text style={styles.assignmentJobName}>
                    {activeAssignment.job?.name ?? 'Unknown Job'}
                  </Text>
                </View>
                <Text style={styles.assignmentMeta}>
                  Checked out by {activeAssignment.checkedOutBy?.name ?? 'Unknown'} on{' '}
                  {formatDate(activeAssignment.checkedOutAt)}
                </Text>
                {activeAssignment.notes && (
                  <Text style={styles.assignmentNotes}>
                    {activeAssignment.notes}
                  </Text>
                )}
              </View>
              <Button
                title="Check In"
                onPress={handleCheckIn}
                loading={checkIn.isPending}
                variant="secondary"
              />
            </View>
          </>
        )}

        {/* Check Out / Mark Available Buttons */}
        {equipment.status === 'AVAILABLE' && (
          <View style={styles.actionRow}>
            <Button
              title="Check Out to Job"
              onPress={() =>
                router.push(
                  `/equipment/check-out?equipmentId=${equipment.id}&equipmentName=${encodeURIComponent(equipment.name)}`,
                )
              }
            />
          </View>
        )}
        {equipment.status === 'MAINTENANCE' && (
          <View style={styles.actionRow}>
            <Button
              title="Mark as Available"
              onPress={handleMarkAvailable}
              loading={updateEquipment.isPending}
              variant="secondary"
            />
          </View>
        )}

        {/* Assignment History */}
        {pastAssignments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Assignment History ({pastAssignments.length})
            </Text>
            <View style={styles.historyList}>
              {pastAssignments.map((assignment) => (
                <View key={assignment.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.historyJobName}>
                      {assignment.job?.name ?? 'Unknown Job'}
                    </Text>
                  </View>
                  <Text style={styles.historyDates}>
                    {formatDate(assignment.checkedOutAt)}
                    {assignment.checkedInAt
                      ? ` — ${formatDate(assignment.checkedInAt)}`
                      : ''}
                  </Text>
                  <Text style={styles.historyMeta}>
                    Out: {assignment.checkedOutBy?.name ?? 'Unknown'}
                    {assignment.checkedInBy?.name
                      ? ` | In: ${assignment.checkedInBy.name}`
                      : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Maintenance Logs */}
        <View style={styles.maintenanceHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Maintenance Log ({equipment.maintenanceLogs?.length ?? 0})
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/equipment/maintenance/create?equipmentId=${equipment.id}&equipmentName=${encodeURIComponent(equipment.name)}`,
              )
            }
            style={styles.addBtn}
          >
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {equipment.maintenanceLogs && equipment.maintenanceLogs.length > 0 ? (
          <View style={styles.historyList}>
            {equipment.maintenanceLogs.map((log) => (
              <View key={log.id} style={styles.maintenanceCard}>
                <View style={styles.maintenanceTop}>
                  <View style={styles.maintenanceTypeBadge}>
                    <Text style={styles.maintenanceTypeText}>
                      {MAINTENANCE_TYPE_LABELS[log.type] ?? log.type}
                    </Text>
                  </View>
                  {log.cost != null && (
                    <Text style={styles.maintenanceCost}>
                      {formatMoney(log.cost)}
                    </Text>
                  )}
                </View>
                <Text style={styles.maintenanceDate}>
                  {formatDate(log.performedAt)}
                </Text>
                {log.description && (
                  <Text style={styles.maintenanceDescription}>
                    {log.description}
                  </Text>
                )}
                {log.notes && (
                  <Text style={styles.maintenanceNotes}>{log.notes}</Text>
                )}
                {log.nextDueDate && (
                  <View style={styles.nextDueRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={colors.warning}
                    />
                    <Text style={styles.nextDueText}>
                      Next due: {formatDate(log.nextDueDate)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No maintenance records yet — tap + to log one
          </Text>
        )}

        {/* Delete button */}
        <View style={styles.dangerZone}>
          <Button
            title="Delete Equipment"
            onPress={handleDelete}
            variant="ghost"
            loading={deleteEquipment.isPending}
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
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    assignmentCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      gap: spacing.md,
    },
    assignmentInfo: {
      gap: spacing.xs,
    },
    assignmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    assignmentJobName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    assignmentMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    assignmentNotes: {
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    actionRow: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    historyList: {
      gap: spacing.sm,
    },
    historyCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 2,
    },
    historyJobName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    historyDates: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    historyMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    maintenanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    addBtn: {
      padding: spacing.xs,
    },
    maintenanceCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    maintenanceTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    maintenanceTypeBadge: {
      backgroundColor: colors.warning + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    maintenanceTypeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.warning,
    },
    maintenanceCost: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    maintenanceDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    maintenanceDescription: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 2,
    },
    maintenanceNotes: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    nextDueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: spacing.xs,
    },
    nextDueText: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: '600',
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
