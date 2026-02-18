import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header } from '../../../src/components/layout';
import { Button, LoadingScreen } from '../../../src/components/ui';
import {
  useIncident,
  useUpdateIncident,
  useUploadIncidentPhoto,
} from '../../../src/hooks/useSafety';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../../src/theme';

const STATUS_FLOW: Record<string, { next: string; label: string }[]> = {
  OPEN: [{ next: 'INVESTIGATING', label: 'Start Investigation' }],
  INVESTIGATING: [{ next: 'RESOLVED', label: 'Mark Resolved' }],
  RESOLVED: [{ next: 'CLOSED', label: 'Close Incident' }],
  CLOSED: [],
};

const getStatusColor = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string } => {
  switch (status) {
    case 'OPEN':
      return { bg: colors.warning + '20', text: colors.warning };
    case 'INVESTIGATING':
      return { bg: colors.primary + '20', text: colors.primary };
    case 'RESOLVED':
      return { bg: colors.success + '20', text: colors.success };
    case 'CLOSED':
      return { bg: colors.textMuted + '20', text: colors.textMuted };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted };
  }
};

const getSeverityColor = (
  severity: string,
  colors: ThemeColors,
): { bg: string; text: string } => {
  switch (severity) {
    case 'LOW':
      return { bg: colors.textMuted + '20', text: colors.textMuted };
    case 'MEDIUM':
      return { bg: colors.warning + '20', text: colors.warning };
    case 'HIGH':
      return { bg: colors.error + '20', text: colors.error };
    case 'CRITICAL':
      return { bg: colors.error + '30', text: colors.error };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted };
  }
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'INJURY':
      return 'Injury';
    case 'NEAR_MISS':
      return 'Near Miss';
    case 'PROPERTY_DAMAGE':
      return 'Property Damage';
    case 'ENVIRONMENTAL':
      return 'Environmental';
    case 'OTHER':
      return 'Other';
    default:
      return type;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'OPEN':
      return 'Open';
    case 'INVESTIGATING':
      return 'Investigating';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
};

const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    case 'CRITICAL':
      return 'Critical';
    default:
      return severity;
  }
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: incident, isLoading } = useIncident(id);
  const updateIncident = useUpdateIncident();
  const uploadPhoto = useUploadIncidentPhoto();

  const [error, setError] = useState('');

  if (isLoading || !incident) return <LoadingScreen />;

  const statusStyle = getStatusColor(incident.status, colors);
  const severityStyle = getSeverityColor(incident.severity, colors);
  const nextActions = STATUS_FLOW[incident.status] ?? [];

  const handleStatusUpdate = async (nextStatus: string) => {
    setError('');
    try {
      await updateIncident.mutateAsync({
        id,
        updates: { status: nextStatus },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      await uploadPhoto.mutateAsync({
        incidentId: id,
        uri: result.assets[0].uri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take photos.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      await uploadPhoto.mutateAsync({
        incidentId: id,
        uri: result.assets[0].uri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLabel}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
        <Text style={styles.detailLabelText}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <Screen padded={false}>
      <Header title="Incident Detail" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title & Badges */}
        <Text style={styles.title}>{incident.title}</Text>
        <View style={styles.badgeRow}>
          <View
            style={[styles.badge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {getStatusLabel(incident.status)}
            </Text>
          </View>
          <View
            style={[styles.badge, { backgroundColor: severityStyle.bg }]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: severityStyle.text },
                incident.severity === 'CRITICAL' && { fontWeight: '900' },
              ]}
            >
              {getSeverityLabel(incident.severity)}
            </Text>
          </View>
        </View>

        {/* Detail Info */}
        <View style={styles.detailCard}>
          <InfoRow
            icon="alert-circle-outline"
            label="Type"
            value={getTypeLabel(incident.type)}
          />
          {incident.job && (
            <InfoRow
              icon="briefcase-outline"
              label="Job"
              value={incident.job.name}
            />
          )}
          <InfoRow
            icon="calendar-outline"
            label="Date"
            value={new Date(incident.incidentDate).toLocaleDateString()}
          />
          {incident.reportedBy && (
            <InfoRow
              icon="person-outline"
              label="Reported By"
              value={incident.reportedBy.name ?? incident.reportedBy.email}
            />
          )}
          {incident.location && (
            <InfoRow
              icon="location-outline"
              label="Location"
              value={incident.location}
            />
          )}
          {incident.resolvedAt && (
            <InfoRow
              icon="checkmark-circle-outline"
              label="Resolved"
              value={new Date(incident.resolvedAt).toLocaleDateString()}
            />
          )}
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.textCard}>
          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>

        {/* Witnesses */}
        {incident.witnesses && (
          <>
            <Text style={styles.sectionTitle}>Witnesses</Text>
            <View style={styles.textCard}>
              <Text style={styles.descriptionText}>
                {incident.witnesses}
              </Text>
            </View>
          </>
        )}

        {/* Action Taken */}
        {incident.actionTaken && (
          <>
            <Text style={styles.sectionTitle}>Action Taken</Text>
            <View style={styles.textCard}>
              <Text style={styles.descriptionText}>
                {incident.actionTaken}
              </Text>
            </View>
          </>
        )}

        {/* Follow Up */}
        {incident.followUp && (
          <>
            <Text style={styles.sectionTitle}>Follow Up</Text>
            <View style={styles.textCard}>
              <Text style={styles.descriptionText}>
                {incident.followUp}
              </Text>
            </View>
          </>
        )}

        {/* Photos */}
        <View style={styles.photoHeader}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleAddPhoto}
            >
              <Ionicons
                name="image-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {incident.photos && incident.photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoScroll}
            contentContainerStyle={styles.photoRow}
          >
            {incident.photos.map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                {photo.caption && (
                  <Text style={styles.photoCaption} numberOfLines={1}>
                    {photo.caption}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyPhotos}>
            No photos attached. Tap the camera or image icon to add.
          </Text>
        )}

        {uploadPhoto.isPending && (
          <Text style={styles.uploadingText}>Uploading photo...</Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Status Actions */}
        {nextActions.length > 0 && (
          <View style={styles.actionsSection}>
            {nextActions.map((action) => (
              <Button
                key={action.next}
                title={action.label}
                onPress={() => handleStatusUpdate(action.next)}
                loading={updateIncident.isPending}
              />
            ))}
          </View>
        )}
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
    title: {
      fontSize: 20,
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
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    detailCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailLabelText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
      textAlign: 'right',
      maxWidth: '55%',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    textCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    descriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    photoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    photoActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    photoButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoScroll: {
      marginBottom: spacing.lg,
    },
    photoRow: {
      gap: spacing.sm,
    },
    photoContainer: {
      width: 150,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    photo: {
      width: 150,
      height: 120,
    },
    photoCaption: {
      fontSize: 11,
      color: colors.textMuted,
      padding: spacing.xs,
    },
    emptyPhotos: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
      paddingVertical: spacing.lg,
    },
    uploadingText: {
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    actionsSection: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
  });
