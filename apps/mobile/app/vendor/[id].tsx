import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { useVendor, useVendorSpending, useDeleteVendor } from '../../src/hooks/useVendors';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: vendor, isLoading } = useVendor(id ?? '');
  const { data: spending } = useVendorSpending(id ?? '');
  const deleteVendor = useDeleteVendor();

  const handleDelete = () => {
    Alert.alert('Delete Vendor', 'Are you sure you want to delete this vendor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVendor.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete vendor');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !vendor) {
    return (
      <Screen padded={false}>
        <Header title="Vendor" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Vendor not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title={vendor.name} showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Info Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.vendorMainName}>{vendor.name}</Text>

          {vendor.contactName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{vendor.contactName}</Text>
            </View>
          )}

          {vendor.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => Linking.openURL(`tel:${vendor.phone}`)}
              >
                {vendor.phone}
              </Text>
            </View>
          )}

          {vendor.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => Linking.openURL(`mailto:${vendor.email}`)}
              >
                {vendor.email}
              </Text>
            </View>
          )}

          {vendor.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{vendor.address}</Text>
            </View>
          )}

          {vendor.website && (
            <View style={styles.infoRow}>
              <Ionicons name="globe-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => {
                  const url = vendor.website!.startsWith('http')
                    ? vendor.website!
                    : `https://${vendor.website}`;
                  Linking.openURL(url);
                }}
              >
                {vendor.website}
              </Text>
            </View>
          )}
        </Card>

        {/* Defaults Card */}
        {(vendor.defaultCategory || vendor.defaultCostCode) && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Defaults</Text>
            <View style={styles.badgeRow}>
              {vendor.defaultCategory && (
                <Badge
                  label={vendor.defaultCategory}
                  color={colors.primary}
                  backgroundColor={colors.primary + '20'}
                />
              )}
              {vendor.defaultCostCode && (
                <Badge
                  label={`${vendor.defaultCostCode.code} - ${vendor.defaultCostCode.name}`}
                  color={colors.textSecondary}
                  backgroundColor={colors.surfaceLight}
                />
              )}
            </View>
          </Card>
        )}

        {/* Spending Summary Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Spending Summary</Text>
          <View style={styles.spendingRow}>
            <View style={styles.spendingItem}>
              <Text style={styles.spendingLabel}>Total Spent</Text>
              <Text style={styles.spendingValue}>
                {formatMoney(spending?.totalSpent ?? 0)}
              </Text>
            </View>
            <View style={styles.spendingDivider} />
            <View style={styles.spendingItem}>
              <Text style={styles.spendingLabel}>Receipts</Text>
              <Text style={styles.spendingValue}>
                {spending?.receiptCount ?? 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Notes */}
        {vendor.notes && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{vendor.notes}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Vendor"
            onPress={() => router.push(`/vendor/edit/${vendor.id}`)}
          />
          <Button
            title="Delete Vendor"
            onPress={handleDelete}
            variant="danger"
            loading={deleteVendor.isPending}
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
    vendorMainName: {
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
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    spendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spendingItem: {
      flex: 1,
      alignItems: 'center',
    },
    spendingDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    spendingLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    spendingValue: {
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
