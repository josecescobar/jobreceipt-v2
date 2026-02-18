import React, { useMemo } from 'react';
import { ScrollView, View, Text, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Screen, Header } from '../../src/components/layout';
import { SettingsSection, SettingsRow } from '../../src/components/settings';
import { useTheme, type ThemeColors, createTypography, spacing, borderRadius } from '../../src/theme';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="About" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="receipt" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.appName, typography.h2]}>JobReceipt</Text>
          <Text style={styles.appVersion}>Version {version} ({buildNumber})</Text>
        </View>

        <SettingsSection title="Links">
          <SettingsRow
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => Linking.openURL('https://jobreceipt.app/help')}
            showChevron
          />
          <SettingsRow
            icon="mail-outline"
            label="Send Feedback"
            subtitle="support@jobreceipt.app"
            onPress={() => Linking.openURL('mailto:support@jobreceipt.app')}
            showChevron
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://jobreceipt.app/privacy')}
            showChevron
          />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://jobreceipt.app/terms')}
            showChevron
          />
        </SettingsSection>

        <Text style={styles.copyright}>
          {'\u00A9'} {new Date().getFullYear()} JobReceipt. All rights reserved.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    marginBottom: spacing.xs,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textMuted,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
