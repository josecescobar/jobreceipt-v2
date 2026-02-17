import React, { useState } from 'react';
import { ScrollView, Text, Alert, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Input, Button } from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';

export default function ProfileScreen() {
  const { user } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);

  const hasChanges =
    firstName.trim() !== (user?.firstName || '') ||
    lastName.trim() !== (user?.lastName || '');

  const handleSave = async () => {
    if (!user || !hasChanges) return;
    setSaving(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Edit Profile" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Input
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          autoCapitalize="words"
          returnKeyType="done"
        />

        <Input
          label="Email"
          value={user?.primaryEmailAddress?.emailAddress || ''}
          editable={false}
          style={styles.readOnly}
        />

        {user?.primaryPhoneNumber && (
          <Input
            label="Phone"
            value={user.primaryPhoneNumber.phoneNumber}
            editable={false}
            style={styles.readOnly}
          />
        )}

        <Text style={styles.hint}>
          Email and phone are managed through your account provider.
        </Text>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={!hasChanges}
          style={styles.saveButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  readOnly: {
    opacity: 0.5,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
