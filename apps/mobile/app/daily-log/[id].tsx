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
import { useDailyLog, useDeleteDailyLog } from '../../src/hooks/useDailyLogs';
import { formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const WEATHER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  SUNNY: 'sunny-outline',
  CLOUDY: 'cloud-outline',
  RAINY: 'rainy-outline',
  SNOWY: 'snow-outline',
  WINDY: 'flag-outline',
};

const WEATHER_LABELS: Record<string, string> = {
  SUNNY: 'Sunny',
  CLOUDY: 'Cloudy',
  RAINY: 'Rainy',
  SNOWY: 'Snowy',
  WINDY: 'Windy',
};

export default function DailyLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: log, isLoading } = useDailyLog(id!);
  const deleteLog = useDeleteDailyLog();

  const photoColumnWidth =
    (Dimensions.get('window').width - spacing.lg * 2 - spacing.sm * 2) / 3;

  const handleDelete = () => {
    Alert.alert(
      'Delete Daily Log?',
      'This log and all its photos will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete daily log.');
            }
          },
        },
      ],
    );
  };

  if (isLoading || !log) {
    return <LoadingScreen />;
  }

  return (
    <Screen padded={false}>
      <Header
        title="Daily Log"
        showBack
        rightAction={{
          icon: 'create-outline',
          onPress: () => router.push(`/daily-log/edit/${id}`),
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date & Weather Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(log.date)}</Text>
          {log.weather && (
            <View style={styles.weatherRow}>
              <Ionicons
                name={WEATHER_ICONS[log.weather] || 'partly-sunny-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.weatherLabel}>
                {WEATHER_LABELS[log.weather] || log.weather}
              </Text>
              {log.temperature != null && (
                <Text style={styles.temperatureText}>{log.temperature}°F</Text>
              )}
            </View>
          )}
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {log.crewCount != null && log.crewCount > 0 && (
            <View style={styles.infoChip}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.infoChipText}>{log.crewCount} crew</Text>
            </View>
          )}
          {log.hoursWorked != null && log.hoursWorked > 0 && (
            <View style={styles.infoChip}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.infoChipText}>{log.hoursWorked}h worked</Text>
            </View>
          )}
          {log.job && (
            <View style={styles.infoChip}>
              <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
              <Text style={styles.infoChipText}>{log.job.name}</Text>
            </View>
          )}
        </View>

        {/* Work Performed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Performed</Text>
          <Text style={styles.sectionBody}>{log.workPerformed}</Text>
        </View>

        {/* Materials Used */}
        {log.materialsUsed ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Used</Text>
            <Text style={styles.sectionBody}>{log.materialsUsed}</Text>
          </View>
        ) : null}

        {/* Safety Notes */}
        {log.safetyNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Notes</Text>
            <Text style={styles.sectionBody}>{log.safetyNotes}</Text>
          </View>
        ) : null}

        {/* Notes */}
        {log.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionBody}>{log.notes}</Text>
          </View>
        ) : null}

        {/* Photos */}
        {log.photos && log.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Photos ({log.photos.length})
            </Text>
            <View style={styles.photoGrid}>
              {log.photos.map((photo) => (
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

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Log"
            onPress={() => router.push(`/daily-log/edit/${id}`)}
          />
          <Button
            title="Delete Log"
            onPress={handleDelete}
            variant="danger"
            loading={deleteLog.isPending}
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
    dateHeader: {
      marginBottom: spacing.lg,
    },
    dateText: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    weatherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    weatherLabel: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    temperatureText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    infoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    infoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary + '12',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    infoChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
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
    actions: {
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    bottomSpacer: {
      height: spacing.xxxl,
    },
  });
