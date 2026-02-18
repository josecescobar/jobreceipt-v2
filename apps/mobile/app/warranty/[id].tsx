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
  useWarranty,
  useDeleteWarranty,
  useAddWarrantyClaim,
} from '../../src/hooks/useWarranties';
import { formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const getStatusBadgeStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'ACTIVE':
      return { bg: colors.success + '20', text: colors.success, label: 'Active' };
    case 'EXPIRING_SOON':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Expiring Soon' };
    case 'EXPIRED':
      return { bg: colors.error + '20', text: colors.error, label: 'Expired' };
    case 'CLAIMED':
      return { bg: colors.primary + '20', text: colors.primary, label: 'Claimed' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

const getClaimStatusStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'OPEN':
      return { bg: colors.warning + '20', text: colors.warning, label: 'Open' };
    case 'IN_PROGRESS':
      return { bg: colors.primary + '20', text: colors.primary, label: 'In Progress' };
    case 'RESOLVED':
      return { bg: colors.success + '20', text: colors.success, label: 'Resolved' };
    case 'DENIED':
      return { bg: colors.error + '20', text: colors.error, label: 'Denied' };
    default:
      return { bg: colors.textMuted + '20', text: colors.textMuted, label: status };
  }
};

export default function WarrantyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: warranty, isLoading } = useWarranty(id!);
  const deleteWarranty = useDeleteWarranty();
  const addClaim = useAddWarrantyClaim();

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDate, setClaimDate] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimError, setClaimError] = useState('');

  if (isLoading || !warranty) {
    return (
      <Screen padded={false}>
        <Header title="Warranty" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  const statusStyle = getStatusBadgeStyle(warranty.status, colors);

  const handleDelete = () => {
    Alert.alert(
      'Delete Warranty?',
      `"${warranty.title}" and all related claims will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWarranty.mutateAsync(warranty.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete warranty.');
            }
          },
        },
      ],
    );
  };

  const handleAddClaim = async () => {
    if (!claimDate) {
      setClaimError('Claim date is required');
      return;
    }
    if (!claimDescription.trim()) {
      setClaimError('Description is required');
      return;
    }
    setClaimError('');

    try {
      await addClaim.mutateAsync({
        warrantyId: warranty.id,
        data: {
          claimDate,
          description: claimDescription.trim(),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowClaimForm(false);
      setClaimDate('');
      setClaimDescription('');
    } catch (err: any) {
      setClaimError(err.response?.data?.message || 'Failed to add claim');
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title={warranty.title}
        showBack
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
            <Text style={styles.infoLabel}>Title</Text>
            <Text style={styles.infoValue}>{warranty.title}</Text>
          </View>
          {warranty.job?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job</Text>
              <Text style={styles.infoValue}>{warranty.job.name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>{formatDate(warranty.startDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoValue}>{formatDate(warranty.endDate)}</Text>
          </View>
          {warranty.manufacturer && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Manufacturer</Text>
              <Text style={styles.infoValue}>{warranty.manufacturer}</Text>
            </View>
          )}
          {warranty.warrantyProvider && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Provider</Text>
              <Text style={styles.infoValue}>{warranty.warrantyProvider}</Text>
            </View>
          )}
          {warranty.contactPhone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{warranty.contactPhone}</Text>
            </View>
          )}
          {warranty.contactEmail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{warranty.contactEmail}</Text>
            </View>
          )}
          {warranty.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{warranty.description}</Text>
            </View>
          )}
          {warranty.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{warranty.notes}</Text>
            </View>
          )}
        </View>

        {/* Claims Section */}
        <View style={styles.claimsHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            Claims ({warranty.claims?.length ?? 0})
          </Text>
          <TouchableOpacity
            onPress={() => setShowClaimForm(!showClaimForm)}
            style={styles.addBtn}
          >
            <Ionicons
              name={showClaimForm ? 'close-circle' : 'add-circle'}
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Add Claim Form */}
        {showClaimForm && (
          <View style={styles.claimForm}>
            <DatePickerField
              label="Claim Date *"
              value={claimDate}
              onChange={setClaimDate}
              placeholder="Select claim date"
            />
            <Input
              label="Description *"
              value={claimDescription}
              onChangeText={setClaimDescription}
              placeholder="Describe the issue..."
              multiline
              numberOfLines={3}
            />
            {claimError ? (
              <Text style={styles.claimError}>{claimError}</Text>
            ) : null}
            <Button
              title="Submit Claim"
              onPress={handleAddClaim}
              loading={addClaim.isPending}
              disabled={!claimDate || !claimDescription.trim()}
            />
          </View>
        )}

        {/* Claims List */}
        {warranty.claims && warranty.claims.length > 0 ? (
          <View style={styles.claimsList}>
            {warranty.claims.map((claim) => {
              const claimStyle = getClaimStatusStyle(claim.status, colors);
              return (
                <View key={claim.id} style={styles.claimCard}>
                  <View style={styles.claimTop}>
                    <View
                      style={[
                        styles.claimStatusBadge,
                        { backgroundColor: claimStyle.bg },
                      ]}
                    >
                      <Text
                        style={[styles.claimStatusText, { color: claimStyle.text }]}
                      >
                        {claimStyle.label}
                      </Text>
                    </View>
                    <Text style={styles.claimDate}>
                      {formatDate(claim.claimDate)}
                    </Text>
                  </View>
                  <Text style={styles.claimDescription}>
                    {claim.description}
                  </Text>
                  {claim.resolution && (
                    <Text style={styles.claimResolution}>
                      Resolution: {claim.resolution}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          !showClaimForm && (
            <Text style={styles.emptyText}>
              No claims filed yet -- tap + to add one
            </Text>
          )
        )}

        {/* Delete button */}
        <View style={styles.dangerZone}>
          <Button
            title="Delete Warranty"
            onPress={handleDelete}
            variant="ghost"
            loading={deleteWarranty.isPending}
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
    claimsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    addBtn: {
      padding: spacing.xs,
    },
    claimForm: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      marginBottom: spacing.md,
    },
    claimError: {
      color: colors.error,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    claimsList: {
      gap: spacing.sm,
    },
    claimCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    claimTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    claimStatusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    claimStatusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    claimDate: {
      fontSize: 12,
      color: colors.textMuted,
    },
    claimDescription: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 2,
    },
    claimResolution: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: spacing.xs,
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
