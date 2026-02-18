import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, LoadingScreen } from '../../../src/components/ui';
import {
  useInspection,
  useUpdateInspection,
} from '../../../src/hooks/useSafety';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../../src/theme';

interface ItemState {
  id: string;
  label: string;
  isCompliant: boolean;
  notes: string;
  sortOrder: number;
}

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: inspection, isLoading } = useInspection(id);
  const updateInspection = useUpdateInspection();

  const [itemStates, setItemStates] = useState<ItemState[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize item states when inspection data loads
  useEffect(() => {
    if (inspection?.items) {
      setItemStates(
        inspection.items.map((item) => ({
          id: item.id,
          label: item.label,
          isCompliant: item.isCompliant,
          notes: item.notes ?? '',
          sortOrder: item.sortOrder,
        })),
      );
      setNotes(inspection.notes ?? '');
    }
  }, [inspection]);

  if (isLoading || !inspection) return <LoadingScreen />;

  const isOpen = inspection.status === 'OPEN';
  const compliantCount = itemStates.filter((i) => i.isCompliant).length;
  const totalCount = itemStates.length;
  const scorePercent =
    totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;

  const toggleCompliance = (itemId: string) => {
    if (!isOpen) return;
    setItemStates((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, isCompliant: !item.isCompliant }
          : item,
      ),
    );
    setHasChanges(true);
  };

  const updateItemNotes = (itemId: string, newNotes: string) => {
    setItemStates((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, notes: newNotes } : item,
      ),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      await updateInspection.mutateAsync({
        id,
        updates: {
          items: itemStates.map((item) => ({
            id: item.id,
            isCompliant: item.isCompliant,
            notes: item.notes || undefined,
          })),
          notes: notes || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    }
  };

  const handleMarkComplete = async () => {
    setError('');
    try {
      await updateInspection.mutateAsync({
        id,
        updates: {
          items: itemStates.map((item) => ({
            id: item.id,
            isCompliant: item.isCompliant,
            notes: item.notes || undefined,
          })),
          notes: notes || undefined,
          status: 'COMPLETE',
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to mark as complete',
      );
    }
  };

  const scoreColor =
    scorePercent >= 80
      ? colors.success
      : scorePercent >= 50
        ? colors.warning
        : colors.error;

  return (
    <Screen padded={false}>
      <Header title={inspection.templateName} showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Info */}
          <View style={styles.infoCard}>
            {inspection.job && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={styles.infoText}>{inspection.job.name}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.infoText}>
                {new Date(inspection.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name={
                  inspection.status === 'COMPLETE'
                    ? 'checkmark-circle'
                    : 'time-outline'
                }
                size={16}
                color={
                  inspection.status === 'COMPLETE'
                    ? colors.success
                    : colors.warning
                }
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      inspection.status === 'COMPLETE'
                        ? colors.success
                        : colors.warning,
                    fontWeight: '600',
                  },
                ]}
              >
                {inspection.status === 'COMPLETE' ? 'Complete' : 'Open'}
              </Text>
            </View>
          </View>

          {/* Score Display */}
          <View style={styles.scoreCard}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {compliantCount}/{totalCount}
            </Text>
            <Text style={styles.scoreLabel}>Items Compliant</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${scorePercent}%`,
                    backgroundColor: scoreColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.scorePercent, { color: scoreColor }]}>
              {scorePercent}%
            </Text>
          </View>

          {/* Checklist Items */}
          <Text style={styles.sectionTitle}>Checklist</Text>
          {itemStates.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <View style={styles.checklistRow}>
                <Switch
                  value={item.isCompliant}
                  onValueChange={() => toggleCompliance(item.id)}
                  trackColor={{
                    false: colors.border,
                    true: colors.success + '80',
                  }}
                  thumbColor={
                    item.isCompliant ? colors.success : colors.surface
                  }
                  disabled={!isOpen}
                />
                <Text
                  style={[
                    styles.checklistLabel,
                    item.isCompliant && styles.checklistLabelCompliant,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {isOpen && (
                <Input
                  value={item.notes}
                  onChangeText={(text) => updateItemNotes(item.id, text)}
                  placeholder="Add notes..."
                  multiline
                  numberOfLines={1}
                />
              )}
              {!isOpen && item.notes ? (
                <Text style={styles.itemNotes}>{item.notes}</Text>
              ) : null}
            </View>
          ))}

          {/* Inspection Notes */}
          <Text style={styles.sectionTitle}>Inspection Notes</Text>
          {isOpen ? (
            <Input
              value={notes}
              onChangeText={(text) => {
                setNotes(text);
                setHasChanges(true);
              }}
              placeholder="Add overall notes..."
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.notesText}>
              {notes || 'No notes added.'}
            </Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Action Buttons */}
          {isOpen && (
            <View style={styles.actions}>
              {hasChanges && (
                <Button
                  title="Save Changes"
                  onPress={handleSave}
                  loading={updateInspection.isPending}
                />
              )}
              <Button
                title="Mark Complete"
                onPress={handleMarkComplete}
                loading={updateInspection.isPending}
                variant="secondary"
              />
            </View>
          )}

          {inspection.completedBy && (
            <Text style={styles.completedText}>
              Completed by {inspection.completedBy.name ?? 'Unknown'} on{' '}
              {inspection.completedAt
                ? new Date(inspection.completedAt).toLocaleDateString()
                : ''}
            </Text>
          )}
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
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    scoreCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    scoreNumber: {
      fontSize: 32,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    scoreLabel: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    progressBar: {
      width: '100%',
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginTop: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    scorePercent: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    checklistItem: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    checklistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    checklistLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    checklistLabelCompliant: {
      color: colors.success,
    },
    itemNotes: {
      fontSize: 12,
      color: colors.textMuted,
      marginLeft: 52,
      marginTop: spacing.xs,
    },
    notesText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    actions: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    completedText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
  });
