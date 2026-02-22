import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { useMileageTrip, useDeleteMileageTrip } from '../../src/hooks/useMileage';
import { useJobs } from '../../src/hooks/useJobs';
import { formatMoney, formatDate, formatMiles } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function MileageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: trip, isLoading } = useMileageTrip(id ?? '');
  const deleteTrip = useDeleteMileageTrip();

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(() => jobsData?.pages?.flatMap((p) => p.data) ?? [], [jobsData]);
  const jobName = useMemo(
    () => jobs.find((j) => j.id === trip?.jobId)?.name ?? trip?.job?.name ?? null,
    [jobs, trip?.jobId, trip?.job?.name],
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this mileage trip? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip.mutateAsync(id!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete trip. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Mileage Trip" showBack />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen>
        <Header title="Mileage Trip" showBack />
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Trip not found.</Text>
        </View>
      </Screen>
    );
  }

  const irsRateDollars = trip.irsRate / 100;

  return (
    <Screen>
      <Header
        title="Mileage Trip"
        showBack
        rightAction={{ icon: 'pencil', onPress: () => router.push(`/mileage/edit/${id}`) }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero cards row */}
        <View style={styles.heroRow}>
          <View style={[styles.heroCard, { flex: 1 }]}>
            <Ionicons name="speedometer-outline" size={24} color={colors.primary} />
            <Text style={styles.heroValue}>{formatMiles(trip.distanceMiles)}</Text>
            <Text style={styles.heroLabel}>Miles</Text>
          </View>
          <View style={[styles.heroCard, { flex: 1 }]}>
            <Ionicons name="cash-outline" size={24} color={colors.success} />
            <Text style={[styles.heroValue, { color: colors.success }]}>
              {formatMoney(trip.totalDeduction)}
            </Text>
            <Text style={styles.heroLabel}>Deduction</Text>
          </View>
        </View>

        {/* Trip details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>
              {formatDate(new Date(trip.date).toISOString().split('T')[0])}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Purpose</Text>
            <Text style={styles.rowValue} numberOfLines={2}>
              {trip.purpose ?? '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>IRS Rate</Text>
            <Text style={styles.rowValue}>${irsRateDollars.toFixed(3)}/mile</Text>
          </View>
        </View>

        {/* Coordinates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>

          <View style={styles.coordRow}>
            <View style={styles.coordDot}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
            </View>
            <View style={styles.coordInfo}>
              <Text style={styles.coordLabel}>Start</Text>
              <Text style={styles.coordValue}>
                {trip.startLat.toFixed(4)}, {trip.startLng.toFixed(4)}
              </Text>
            </View>
          </View>

          <View style={styles.coordLine} />

          <View style={styles.coordRow}>
            <View style={styles.coordDot}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
            </View>
            <View style={styles.coordInfo}>
              <Text style={styles.coordLabel}>End</Text>
              <Text style={styles.coordValue}>
                {trip.endLat.toFixed(4)}, {trip.endLng.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>

        {/* Job assignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => trip.jobId && router.push(`/job/${trip.jobId}`)}
            disabled={!trip.jobId}
          >
            <Text style={styles.rowLabel}>Job</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, trip.jobId ? styles.link : null]}>
                {jobName ?? (trip.jobId ? 'View Job' : 'Unassigned')}
              </Text>
              {trip.jobId && (
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleteTrip.isPending}
        >
          {deleteTrip.isPending ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mutedText: { color: colors.textMuted, fontSize: 16 },
    editButton: { padding: spacing.xs },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    heroRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
    },
    heroValue: { fontSize: 22, fontWeight: '700', color: colors.text },
    heroLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    section: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    rowLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    rowValue: { fontSize: 14, fontWeight: '500', color: colors.text, textAlign: 'right', flex: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 2, justifyContent: 'flex-end' },
    link: { color: colors.primary },
    divider: { height: 1, backgroundColor: colors.border, opacity: 0.5 },
    coordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
    coordDot: { width: 24, alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5 },
    coordLine: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 11 },
    coordInfo: { flex: 1, marginLeft: spacing.sm },
    coordLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    coordValue: { fontSize: 13, color: colors.text, fontWeight: '500', marginTop: 2 },
    deleteButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.md, borderRadius: 12,
      borderWidth: 1, borderColor: colors.error + '40', backgroundColor: colors.error + '10',
    },
    deleteText: { fontSize: 15, fontWeight: '600', color: colors.error },
  });
