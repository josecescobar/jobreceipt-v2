import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Card, Badge } from '../../src/components/ui';
import {
  useSubcontractor,
  useSubcontractorSummary,
  useUpdateSubcontractor,
  useDeleteSubcontractor,
} from '../../src/hooks/useSubcontractors';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

function getInsuranceStatus(expiryDate: string | null): {
  label: string;
  color: string;
  daysUntil: number | null;
} {
  if (!expiryDate) return { label: 'Not set', color: 'textMuted', daysUntil: null };

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: `Expired ${Math.abs(days)} days ago`, color: 'error', daysUntil: days };
  if (days <= 30) return { label: `Expires in ${days} days`, color: 'warning', daysUntil: days };
  return { label: `Expires ${formatDate(expiryDate)}`, color: 'success', daysUntil: days };
}

export default function SubcontractorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: sub, isLoading } = useSubcontractor(id ?? '');
  const { data: summary } = useSubcontractorSummary(id ?? '');
  const updateSub = useUpdateSubcontractor();
  const deleteSub = useDeleteSubcontractor();

  const insuranceStatus = useMemo(
    () => getInsuranceStatus(sub?.insuranceExpiry ?? null),
    [sub?.insuranceExpiry],
  );

  const handleToggleW9 = async (value: boolean) => {
    if (!id) return;
    try {
      await updateSub.mutateAsync({ id, updates: { w9Received: value } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // revert handled by query refetch
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Subcontractor', 'Are you sure you want to delete this subcontractor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSub.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete subcontractor');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !sub) {
    return (
      <Screen padded={false}>
        <Header title="Subcontractor" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Subcontractor not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const insuranceColor =
    insuranceStatus.color === 'error' ? colors.error :
    insuranceStatus.color === 'warning' ? colors.warning :
    insuranceStatus.color === 'success' ? colors.success :
    colors.textMuted;

  return (
    <Screen padded={false}>
      <Header title={sub.name} showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.mainName}>{sub.name}</Text>

          {sub.companyName && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{sub.companyName}</Text>
            </View>
          )}

          {sub.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => Linking.openURL(`tel:${sub.phone}`)}
              >
                {sub.phone}
              </Text>
            </View>
          )}

          {sub.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => Linking.openURL(`mailto:${sub.email}`)}
              >
                {sub.email}
              </Text>
            </View>
          )}

          {sub.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{sub.address}</Text>
            </View>
          )}
        </Card>

        {/* Trade & License Card */}
        {(sub.trade || sub.licenseNumber) && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Trade & License</Text>
            {sub.trade && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Trade</Text>
                <Text style={styles.detailValue}>{sub.trade}</Text>
              </View>
            )}
            {sub.licenseNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License #</Text>
                <Text style={styles.detailValue}>{sub.licenseNumber}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Insurance Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Insurance</Text>
          <View style={styles.insuranceRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={insuranceColor} />
            <Text style={[styles.insuranceText, { color: insuranceColor }]}>
              {insuranceStatus.label}
            </Text>
          </View>
        </Card>

        {/* W9 Status Card */}
        <Card style={styles.card}>
          <View style={styles.w9Row}>
            <View style={styles.w9Info}>
              <Text style={styles.cardTitle}>W-9 Status</Text>
              <Text style={styles.w9Subtitle}>
                {sub.w9Received ? 'W-9 form has been received' : 'W-9 form not yet received'}
              </Text>
            </View>
            <Switch
              value={sub.w9Received}
              onValueChange={handleToggleW9}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Payment Summary Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(summary?.totalPaid ?? 0)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>
                {summary?.expenseCount ?? 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Notes */}
        {sub.notes && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{sub.notes}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Subcontractor"
            onPress={() => router.push(`/subcontractor/edit/${sub.id}`)}
          />
          <Button
            title="Delete Subcontractor"
            onPress={handleDelete}
            variant="danger"
            loading={deleteSub.isPending}
            style={styles.deleteButton}
          />
        </View>
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
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    card: {
      marginBottom: spacing.md,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },
    mainName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    infoText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    linkText: {
      color: colors.primary,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textMuted,
    },
    detailValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    insuranceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    insuranceText: {
      fontSize: 15,
      fontWeight: '600',
    },
    w9Row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    w9Info: {
      flex: 1,
      marginRight: spacing.md,
    },
    w9Subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: -spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    notesText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    actions: {
      marginTop: spacing.md,
    },
    deleteButton: {
      marginTop: spacing.md,
    },
  });
