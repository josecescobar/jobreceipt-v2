import React from 'react';
import { ScrollView, Text, Alert, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { Screen } from '../../src/components/layout';
import { SettingsSection, SettingsRow } from '../../src/components/settings';
import { useAuthStore } from '../../src/stores/auth.store';
import { spacing, typography, colors } from '../../src/theme';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const orgName = useAuthStore((s) => s.organizationName);

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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <SettingsSection title="Profile">
          <SettingsRow
            icon="person"
            label="Name"
            value={user?.fullName || '—'}
          />
          <SettingsRow
            icon="mail"
            label="Email"
            value={user?.primaryEmailAddress?.emailAddress || '—'}
          />
        </SettingsSection>

        <SettingsSection title="Organization">
          <SettingsRow
            icon="business"
            label="Organization"
            value={orgName || 'Not set'}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon="log-out"
            label="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </SettingsSection>

        <Text style={styles.version}>
          JobReceipt v{Constants.expoConfig?.version ?? '1.0.0'}
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
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
