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
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField, LoadingScreen } from '../../../src/components/ui';
import {
  usePunchListItem,
  useUpdatePunchListItem,
  useDeletePunchListItem,
} from '../../../src/hooks/usePunchLists';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: '#9CA3AF' },
  { value: 'MEDIUM', label: 'Medium', color: '#EAB308' },
  { value: 'HIGH', label: 'High', color: '#F97316' },
  { value: 'URGENT', label: 'Urgent', color: '#EF4444' },
] as const;

export default function EditPunchListItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: item, isLoading } = usePunchListItem(id!);
  const updateItem = useUpdatePunchListItem();
  const deleteItem = useDeletePunchListItem();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setPriority(item.priority);
      setAssignedToId(item.assignedToId || '');
      setDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    }
  }, [item]);

  const canSubmit = title.trim().length > 0;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!item) return;
    setError('');

    try {
      await updateItem.mutateAsync({
        id: id!,
        jobId: item.jobId,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority: priority || undefined,
          assignedToId: assignedToId.trim() || undefined,
          dueDate: dueDate || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update punch list item',
      );
    }
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      'Delete Punch List Item?',
      'This item and all its photos will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem.mutateAsync({ id: id!, jobId: item.jobId });
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              router.back();
              setTimeout(() => router.back(), 100);
            } catch {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <Screen padded={false}>
      <Header title="Edit Punch List Item" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fix drywall crack in living room"
          />

          {/* Description */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details..."
            multiline
            numberOfLines={4}
          />

          {/* Priority */}
          <Text style={styles.sectionLabel}>Priority</Text>
          <View style={styles.priorityGrid}>
            {PRIORITY_OPTIONS.map((opt) => {
              const active = priority === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priorityChip,
                    active && {
                      backgroundColor: opt.color,
                      borderColor: opt.color,
                    },
                  ]}
                  onPress={() => setPriority(opt.value)}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: active ? colors.white : opt.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityChipText,
                      active && styles.priorityChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Assigned To */}
          <Input
            label="Assign to (Member ID)"
            value={assignedToId}
            onChangeText={setAssignedToId}
            placeholder="Enter member ID (optional)"
          />

          {/* Due Date */}
          <DatePickerField
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
            placeholder="Select due date (optional)"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={updateItem.isPending}
            disabled={!canSubmit}
          />

          <View style={styles.deleteWrap}>
            <Button
              title="Delete Item"
              onPress={handleDelete}
              variant="danger"
              loading={deleteItem.isPending}
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
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    priorityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    priorityChip: {
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
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    priorityChipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    priorityChipTextActive: {
      color: colors.white,
      fontWeight: '600',
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
