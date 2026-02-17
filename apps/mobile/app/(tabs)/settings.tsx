import React, { useState } from 'react';
import { ScrollView, Text, Alert, Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { Screen } from '../../src/components/layout';
import { Badge } from '../../src/components/ui';
import { SettingsSection, SettingsRow } from '../../src/components/settings';
import { useAuthStore } from '../../src/stores/auth.store';
import { organizationsApi } from '../../src/api/organizations';
import { exportReceipts, exportExpenses, exportMileage } from '../../src/lib/export';
import { spacing, typography, colors, borderRadius } from '../../src/theme';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  BOOKKEEPER: 'Bookkeeper',
  CREW: 'Crew',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  OWNER: { bg: colors.primary + '20', text: colors.primary },
  BOOKKEEPER: { bg: colors.success + '20', text: colors.success },
  CREW: { bg: colors.textMuted + '20', text: colors.textMuted },
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const orgId = useAuthStore((s) => s.organizationId);
  const orgName = useAuthStore((s) => s.organizationName);
  const userRole = useAuthStore((s) => s.userRole);
  const isOwner = userRole === 'OWNER';

  const [exporting, setExporting] = useState<'receipts' | 'expenses' | 'mileage' | null>(null);

  const initials = (() => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  })();

  const roleStyle = ROLE_COLORS[userRole || ''] || ROLE_COLORS.CREW;

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

        {/* Profile Header Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/settings/profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.fullName || 'Set up your profile'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.primaryEmailAddress?.emailAddress || ''}
            </Text>
          </View>
          <Badge
            label={userRole ? ROLE_LABELS[userRole] ?? userRole : '—'}
            color={roleStyle.text}
            backgroundColor={roleStyle.bg}
          />
        </TouchableOpacity>

        <SettingsSection title="Organization">
          <SettingsRow
            icon="business-outline"
            label="Organization"
            value={orgName || 'Not set'}
            onPress={isOwner ? handleEditOrgName : undefined}
            showChevron={isOwner}
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

        <SettingsSection title="Preferences">
          <SettingsRow
            icon="options-outline"
            label="App Preferences"
            subtitle="Mileage rate, tax rate, categories"
            onPress={() => router.push('/settings/preferences')}
            showChevron
          />
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

        <SettingsSection title="">
          <SettingsRow
            icon="information-circle-outline"
            label="About"
            subtitle={`Version ${version}`}
            onPress={() => router.push('/settings/about')}
            showChevron
          />
        </SettingsSection>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
});
