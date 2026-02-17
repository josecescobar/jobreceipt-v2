import React, { useState } from 'react';
import { ScrollView, Text, Alert, Linking, Switch, Platform, View, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { Screen } from '../../src/components/layout';
import { SettingsSection, SettingsRow } from '../../src/components/settings';
import { useAuthStore } from '../../src/stores/auth.store';
import { useSettings } from '../../src/hooks/useSettings';
import { organizationsApi } from '../../src/api/organizations';
import { exportReceipts, exportExpenses, exportMileage } from '../../src/lib/export';
import { spacing, typography, colors } from '../../src/theme';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  BOOKKEEPER: 'Bookkeeper',
  CREW: 'Crew',
};

function centsToDollarStr(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const orgId = useAuthStore((s) => s.organizationId);
  const orgName = useAuthStore((s) => s.organizationName);
  const userRole = useAuthStore((s) => s.userRole);
  const isOwner = userRole === 'OWNER';

  const {
    mileageRateCents,
    notificationsEnabled,
    setMileageRateCents,
    setNotificationsEnabled,
  } = useSettings();

  const [exporting, setExporting] = useState<'receipts' | 'expenses' | 'mileage' | null>(null);

  const handleEditName = () => {
    if (!user) return;
    const currentName = user.fullName || '';

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Edit Name',
        'Enter your full name',
        async (name) => {
          if (!name?.trim()) return;
          const parts = name.trim().split(' ');
          const firstName = parts[0];
          const lastName = parts.slice(1).join(' ') || undefined;
          try {
            await user.update({ firstName, lastName });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Failed to update name.');
          }
        },
        'plain-text',
        currentName,
      );
    } else {
      // Android: Alert.prompt not available, use simple alert
      Alert.alert(
        'Edit Name',
        'To edit your name, visit your profile in the Clerk dashboard.',
      );
    }
  };

  const handleEditMileageRate = () => {
    const currentRate = centsToDollarStr(mileageRateCents);
    const irsRate = centsToDollarStr(IRS_MILEAGE_RATE_CENTS);

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Mileage Rate',
        `Enter rate in dollars per mile.\nIRS standard rate: $${irsRate}/mi`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Reset to $${irsRate}`,
            onPress: () => {
              setMileageRateCents(IRS_MILEAGE_RATE_CENTS);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
          {
            text: 'Save',
            onPress: (value) => {
              const parsed = parseFloat(value || '');
              if (isNaN(parsed) || parsed <= 0) {
                Alert.alert('Invalid Rate', 'Please enter a valid dollar amount.');
                return;
              }
              setMileageRateCents(Math.round(parsed * 100));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ],
        'plain-text',
        currentRate,
        'decimal-pad',
      );
    } else {
      Alert.alert(
        'Mileage Rate',
        `Current rate: $${currentRate}/mi\nIRS standard: $${irsRate}/mi`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Reset to IRS Rate ($${irsRate})`,
            onPress: () => {
              setMileageRateCents(IRS_MILEAGE_RATE_CENTS);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ],
      );
    }
  };

  const handleEditOrgName = () => {
    if (!isOwner || !orgId) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Organization Name',
        'Enter the new organization name',
        async (name) => {
          if (!name?.trim()) return;
          try {
            await organizationsApi.update(orgId, { name: name.trim() });
            useAuthStore.getState().setOrganization(orgId, name.trim());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Failed to update organization name.');
          }
        },
        'plain-text',
        orgName || '',
      );
    } else {
      Alert.alert(
        'Edit Organization',
        'Organization name editing is coming soon on Android.',
      );
    }
  };

  const handleExport = async (type: 'receipts' | 'expenses' | 'mileage') => {
    if (exporting) return;
    setExporting(type);
    try {
      if (type === 'receipts') await exportReceipts();
      else if (type === 'expenses') await exportExpenses();
      else await exportMileage();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Something went wrong.');
    } finally {
      setExporting(null);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          useAuthStore.getState().reset();
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            if (Platform.OS === 'ios') {
              Alert.prompt(
                'Confirm Deletion',
                'Type DELETE to confirm account deletion.',
                async (text) => {
                  if (text !== 'DELETE') {
                    Alert.alert('Cancelled', 'Account deletion was cancelled.');
                    return;
                  }
                  try {
                    await user?.delete();
                    useAuthStore.getState().reset();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  } catch {
                    Alert.alert('Error', 'Failed to delete account. Please try again.');
                  }
                },
                'plain-text',
              );
            } else {
              Alert.alert(
                'Final Confirmation',
                'Are you absolutely sure? This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Yes, Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await user?.delete();
                        useAuthStore.getState().reset();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      } catch {
                        Alert.alert('Error', 'Failed to delete account. Please try again.');
                      }
                    },
                  },
                ],
              );
            }
          },
        },
      ],
    );
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <SettingsSection title="Profile">
          <SettingsRow
            icon="person-outline"
            label="Name"
            value={user?.fullName || '—'}
            onPress={handleEditName}
            showChevron
          />
          <SettingsRow
            icon="mail-outline"
            label="Email"
            value={user?.primaryEmailAddress?.emailAddress || '—'}
          />
          {user?.primaryPhoneNumber && (
            <SettingsRow
              icon="call-outline"
              label="Phone"
              value={user.primaryPhoneNumber.phoneNumber}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Organization">
          <SettingsRow
            icon="business-outline"
            label="Organization"
            value={orgName || 'Not set'}
            onPress={isOwner ? handleEditOrgName : undefined}
            showChevron={isOwner}
          />
          <SettingsRow
            icon="shield-outline"
            label="Your Role"
            value={userRole ? ROLE_LABELS[userRole] ?? userRole : '—'}
          />
          {isOwner && (
            <SettingsRow
              icon="people-outline"
              label="Manage Members"
              onPress={() => router.push('/settings/members')}
              showChevron
            />
          )}
        </SettingsSection>

        <SettingsSection title="App Settings">
          <SettingsRow
            icon="speedometer-outline"
            label="Mileage Rate"
            value={`$${centsToDollarStr(mileageRateCents)}/mi`}
            onPress={handleEditMileageRate}
            showChevron
          />
          <SettingsRow
            icon="cash-outline"
            label="Currency"
            value="USD"
          />
          <View style={styles.toggleRow}>
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
            />
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={styles.switch}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Data & Export">
          <SettingsRow
            icon="download-outline"
            label={exporting === 'receipts' ? 'Exporting Receipts...' : 'Export Receipts CSV'}
            onPress={() => handleExport('receipts')}
            showChevron={exporting !== 'receipts'}
          />
          <SettingsRow
            icon="download-outline"
            label={exporting === 'expenses' ? 'Exporting Expenses...' : 'Export Expenses CSV'}
            onPress={() => handleExport('expenses')}
            showChevron={exporting !== 'expenses'}
          />
          <SettingsRow
            icon="car-outline"
            label={exporting === 'mileage' ? 'Exporting Mileage...' : 'Export Mileage CSV'}
            onPress={() => handleExport('mileage')}
            showChevron={exporting !== 'mileage'}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => Linking.openURL('https://jobreceipt.app/help')}
            showChevron
          />
          <SettingsRow
            icon="mail-outline"
            label="Send Feedback"
            onPress={() => Linking.openURL('mailto:support@jobreceipt.app')}
            showChevron
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            danger
          />
          <SettingsRow
            icon="trash-outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
          />
        </SettingsSection>

        <Text style={styles.version}>
          JobReceipt v{version}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  toggleRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  switch: {
    position: 'absolute',
    right: spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
