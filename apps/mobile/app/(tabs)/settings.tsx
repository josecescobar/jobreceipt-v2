import React, { useState } from 'react';
import { ScrollView, Text, Alert, Linking, Switch, View, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { Screen } from '../../src/components/layout';
import { SettingsSection, SettingsRow } from '../../src/components/settings';
import { useAuthStore } from '../../src/stores/auth.store';
import { spacing, typography, colors } from '../../src/theme';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  BOOKKEEPER: 'Bookkeeper',
  CREW: 'Crew',
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const orgName = useAuthStore((s) => s.organizationName);
  const userRole = useAuthStore((s) => s.userRole);
  const [notifications, setNotifications] = useState(true);

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

  const comingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} will be available in a future update.`);
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
          />
          <SettingsRow
            icon="shield-outline"
            label="Your Role"
            value={userRole ? ROLE_LABELS[userRole] ?? userRole : '—'}
          />
        </SettingsSection>

        <SettingsSection title="App Settings">
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
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              style={styles.switch}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Data & Export">
          <SettingsRow
            icon="download-outline"
            label="Export Receipts CSV"
            onPress={() => comingSoon('Receipt export')}
            showChevron
          />
          <SettingsRow
            icon="download-outline"
            label="Export Expenses CSV"
            onPress={() => comingSoon('Expense export')}
            showChevron
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
          <SettingsRow
            icon="star-outline"
            label="Rate the App"
            onPress={() => comingSoon('App Store rating')}
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
