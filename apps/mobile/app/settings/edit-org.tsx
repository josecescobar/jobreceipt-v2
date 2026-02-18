import React, { useState, useMemo } from 'react';
import { ScrollView, Alert, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Screen, Header } from '../../src/components/layout';
import { Input, Button } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { organizationsApi } from '../../src/api/organizations';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function EditOrgScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const orgId = useAuthStore((s) => s.organizationId);
  const orgName = useAuthStore((s) => s.organizationName);

  const [name, setName] = useState(orgName || '');
  const [saving, setSaving] = useState(false);

  const hasChanges = name.trim() !== (orgName || '') && name.trim().length > 0;

  const handleSave = async () => {
    if (!orgId || !hasChanges) return;
    setSaving(true);
    try {
      await organizationsApi.update(orgId, { name: name.trim() });
      useAuthStore.getState().setOrganization(orgId, name.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update organization name.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Edit Organization" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Organization Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter organization name"
          autoCapitalize="words"
          returnKeyType="done"
          autoFocus
        />

        <Button
          title="Save"
          onPress={handleSave}
          loading={saving}
          disabled={!hasChanges}
          style={styles.saveButton}
        />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
