import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Badge } from '../../src/components/ui';
import { organizationsApi, OrgMember } from '../../src/api/organizations';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function MembersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    OWNER: { bg: colors.primary + '20', text: colors.primary },
    BOOKKEEPER: { bg: colors.success + '20', text: colors.success },
    CREW: { bg: colors.textMuted + '20', text: colors.textMuted },
  };

  const orgId = useAuthStore((s) => s.organizationId);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const loadMembers = async () => {
    if (!orgId) return;
    try {
      const data = await organizationsApi.getMembers(orgId);
      setMembers(data);
    } catch {
      Alert.alert('Error', 'Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [orgId]);

  const handleInvite = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Invite Member',
        'Enter the email address of the person to invite.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Invite as Crew',
            onPress: (email) => doInvite(email, 'CREW'),
          },
          {
            text: 'Invite as Bookkeeper',
            onPress: (email) => doInvite(email, 'BOOKKEEPER'),
          },
        ],
        'plain-text',
        '',
        'email-address',
      );
    } else {
      Alert.alert(
        'Invite Member',
        'Member invitations are coming soon on Android.',
      );
    }
  };

  const doInvite = async (email: string | undefined, role: string) => {
    if (!email?.trim() || !orgId) return;
    setInviting(true);
    try {
      await organizationsApi.inviteMember(orgId, email.trim(), role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Invited', `Invitation sent to ${email.trim()}.`);
      loadMembers();
    } catch {
      Alert.alert('Error', 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const renderMember = ({ item }: { item: OrgMember }) => {
    const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.CREW;
    const name = item.user?.name || 'Unnamed';
    const email = item.user?.email || '';
    const isPending = !item.acceptedAt;

    return (
      <View style={styles.memberRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {name}
            </Text>
            {isPending && (
              <Text style={styles.pendingLabel}>Pending</Text>
            )}
          </View>
          <Text style={styles.memberEmail} numberOfLines={1}>
            {email}
          </Text>
        </View>
        <Badge
          label={item.role}
          color={roleStyle.text}
          backgroundColor={roleStyle.bg}
        />
      </View>
    );
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Members" showBack />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No members yet</Text>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Button
                title={inviting ? 'Inviting...' : 'Invite Member'}
                onPress={handleInvite}
                loading={inviting}
              />
            </View>
          }
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pendingLabel: {
    fontSize: 11,
    color: colors.warning,
    fontStyle: 'italic',
  },
  memberEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  footer: {
    marginTop: spacing.xl,
  },
});
