import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button } from '../../src/components/ui';
import { organizationsApi } from '../../src/api/organizations';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

const ROLES = [
  { value: 'CREW', label: 'Crew', description: 'Can create own expenses' },
  { value: 'BOOKKEEPER', label: 'Bookkeeper', description: 'Can view all and approve' },
] as const;

export default function InviteMemberScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const orgId = useAuthStore((s) => s.organizationId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('CREW');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !orgId) return;

    if (!trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await organizationsApi.inviteMember(orgId, trimmed, role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Invited', `Invitation sent to ${trimmed}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send invitation.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Invite Member" showBack />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="member@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Role</Text>
          <View style={styles.roleList}>
            {ROLES.map((r) => {
              const isSelected = role === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleCard,
                    isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text style={[styles.roleName, isSelected && { color: colors.primary }]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Sending...' : 'Send Invite'}
              onPress={handleInvite}
              loading={loading}
            />
          </View>

          <Text style={styles.hint}>
            The person must have a JobReceipt account. They'll see your organization when they next open the app.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    form: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
    },
    roleList: {
      gap: spacing.sm,
    },
    roleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
    },
    roleName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    roleDesc: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    buttonContainer: {
      marginTop: spacing.xl,
    },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
      lineHeight: 18,
    },
  });
