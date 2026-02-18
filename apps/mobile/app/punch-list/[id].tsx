import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, LoadingScreen } from '../../src/components/ui';
import {
  usePunchListItem,
  useUpdatePunchListItem,
  useDeletePunchListItem,
} from '../../src/hooks/usePunchLists';
import { formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#9CA3AF',
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function PunchListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: item, isLoading } = usePunchListItem(id!);
  const updateItem = useUpdatePunchListItem();
  const deleteItem = useDeletePunchListItem();

  const photoColumnWidth =
    (Dimensions.get('window').width - spacing.lg * 2 - spacing.sm * 2) / 3;

  const handleStatusChange = async (newStatus: string) => {
    if (!item) return;
    try {
      await updateItem.mutateAsync({
        id: id!,
        jobId: item.jobId,
        updates: { status: newStatus },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to update status.');
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
            } catch {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ],
    );
  };

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const priorityColor = PRIORITY_COLORS[item.priority] || '#9CA3AF';
  const statusColor =
    item.status === 'COMPLETED'
      ? colors.success
      : item.status === 'IN_PROGRESS'
      ? colors.warning
      : colors.textMuted;

  return (
    <Screen padded={false}>
      <Header
        title="Punch List Item"
        showBack
        rightAction={{
          icon: 'create-outline',
          onPress: () => router.push(`/punch-list/edit/${id}`),
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
            <View
              style={[styles.badgeDot, { backgroundColor: priorityColor }]}
            />
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {PRIORITY_LABELS[item.priority]}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionBody}>{item.description}</Text>
          </View>
        ) : null}

        {/* Details */}
        <View style={styles.detailsCard}>
          {item.assignedTo && (
            <View style={styles.detailRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Assigned to</Text>
              <Text style={styles.detailValue}>
                {item.assignedTo.name || 'Unknown'}
              </Text>
            </View>
          )}
          {item.dueDate && (
            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Due date</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.dueDate)}
              </Text>
            </View>
          )}
          {item.createdBy && (
            <View style={styles.detailRow}>
              <Ionicons
                name="person-add-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Created by</Text>
              <Text style={styles.detailValue}>
                {item.createdBy.name || 'Unknown'}
              </Text>
            </View>
          )}
          {item.completedBy && (
            <View style={styles.detailRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={colors.success}
              />
              <Text style={styles.detailLabel}>Completed by</Text>
              <Text style={styles.detailValue}>
                {item.completedBy.name || 'Unknown'}
              </Text>
            </View>
          )}
          {item.completedAt && (
            <View style={styles.detailRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.success}
              />
              <Text style={styles.detailLabel}>Completed at</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.completedAt)}
              </Text>
            </View>
          )}
          {item.job && (
            <View style={styles.detailRow}>
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.detailLabel}>Job</Text>
              <Text style={styles.detailValue}>{item.job.name}</Text>
            </View>
          )}
        </View>

        {/* Photos */}
        {item.photos && item.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Photos ({item.photos.length})
            </Text>
            <View style={styles.photoGrid}>
              {item.photos.map((photo) => (
                <View
                  key={photo.id}
                  style={[
                    styles.photoThumb,
                    { width: photoColumnWidth, height: photoColumnWidth },
                  ]}
                >
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  {photo.caption ? (
                    <Text style={styles.photoCaption} numberOfLines={1}>
                      {photo.caption}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Status Action Buttons */}
        <View style={styles.statusActions}>
          {(item.status === 'OPEN') && (
            <Button
              title="Mark In Progress"
              onPress={() => handleStatusChange('IN_PROGRESS')}
              variant="secondary"
              loading={updateItem.isPending}
            />
          )}
          {(item.status === 'OPEN' || item.status === 'IN_PROGRESS') && (
            <Button
              title="Mark Complete"
              onPress={() => handleStatusChange('COMPLETED')}
              loading={updateItem.isPending}
            />
          )}
          {item.status === 'COMPLETED' && (
            <Button
              title="Reopen"
              onPress={() => handleStatusChange('OPEN')}
              variant="secondary"
              loading={updateItem.isPending}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Item"
            onPress={() => router.push(`/punch-list/edit/${id}`)}
            variant="secondary"
          />
          <Button
            title="Delete Item"
            onPress={handleDelete}
            variant="danger"
            loading={deleteItem.isPending}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    sectionBody: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textMuted,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    photoThumb: {
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    photoImage: {
      width: '100%',
      height: '100%',
    },
    photoCaption: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: '#fff',
      fontSize: 11,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    statusActions: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    actions: {
      gap: spacing.sm,
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
