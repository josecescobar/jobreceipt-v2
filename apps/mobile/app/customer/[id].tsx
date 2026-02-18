import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Card } from '../../src/components/ui';
import { useCustomer, useCustomerJobs, useDeleteCustomer } from '../../src/hooks/useCustomers';
import { formatMoney, formatDate } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: customer, isLoading } = useCustomer(id ?? '');
  const { data: jobsData } = useCustomerJobs(id ?? '');
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = () => {
    Alert.alert('Delete Customer', 'Are you sure you want to delete this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete customer');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !customer) {
    return (
      <Screen padded={false}>
        <Header title="Customer" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Customer not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const fullAddress = [customer.address, customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ');

  const jobs = jobsData?.data ?? [];

  return (
    <Screen padded={false}>
      <Header title={customer.name} showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Info Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.customerMainName}>{customer.name}</Text>

          {customer.companyName && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{customer.companyName}</Text>
            </View>
          )}

          {customer.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => Linking.openURL(`tel:${customer.phone}`)}
              >
                {customer.phone}
              </Text>
            </View>
          )}

          {customer.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text
                style={[styles.infoText, styles.linkText]}
                onPress={() => Linking.openURL(`mailto:${customer.email}`)}
              >
                {customer.email}
              </Text>
            </View>
          )}

          {fullAddress ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{fullAddress}</Text>
            </View>
          ) : null}
        </Card>

        {/* Lifetime Spending Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Lifetime Spending</Text>
          <View style={styles.spendingRow}>
            <View style={styles.spendingItem}>
              <Text style={styles.spendingLabel}>Total Revenue</Text>
              <Text style={styles.spendingValue}>
                {formatMoney(customer.lifetimeSpending ?? 0)}
              </Text>
            </View>
            <View style={styles.spendingDivider} />
            <View style={styles.spendingItem}>
              <Text style={styles.spendingLabel}>Jobs</Text>
              <Text style={styles.spendingValue}>
                {customer.jobCount ?? 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Job History */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Job History</Text>
          {jobs.length === 0 ? (
            <Text style={styles.emptyText}>No jobs linked to this customer yet.</Text>
          ) : (
            jobs.map((job: any) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobRow}
                onPress={() => router.push(`/job/${job.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.jobInfo}>
                  <Text style={styles.jobName}>{job.name}</Text>
                  <Text style={styles.jobDate}>{formatDate(job.createdAt)}</Text>
                </View>
                <View style={styles.jobStatusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          job.status === 'ACTIVE'
                            ? colors.success + '20'
                            : job.status === 'COMPLETED'
                              ? colors.primary + '20'
                              : colors.textMuted + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            job.status === 'ACTIVE'
                              ? colors.success
                              : job.status === 'COMPLETED'
                                ? colors.primary
                                : colors.textMuted,
                        },
                      ]}
                    >
                      {job.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Notes */}
        {customer.notes && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{customer.notes}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Customer"
            onPress={() => router.push(`/customer/edit/${customer.id}`)}
          />
          <Button
            title="Delete Customer"
            onPress={handleDelete}
            variant="danger"
            loading={deleteCustomer.isPending}
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
    customerMainName: {
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
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    jobRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    jobInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    jobName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    jobDate: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    jobStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
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
