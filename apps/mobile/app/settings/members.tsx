import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Platform,
  ActionSheetIOS,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Badge } from '../../src/components/ui';
import { organizationsApi, OrgMember } from '../../src/api/organizations';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function MembersScreen() {
  const router = useRouter();
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

  // Reload members on mount and when returning from invite screen
  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [orgId]),
  );

  const handleMemberAction = (member: OrgMember) => {
    if (member.role === 'OWNER') return;

    const options = ['Change Role', 'Remove Member', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          title: member.user?.name || member.user?.email || 'Member',
        },
        (index) => {
          if (index === 0) handleChangeRole(member);
          else if (index === 1) handleRemove(member);
        },
      );
    } else {
      Alert.alert(
        member.user?.name || member.user?.email || 'Member',
        undefined,
        [
          { text: 'Change Role', onPress: () => handleChangeRole(member) },
          { text: 'Remove Member', style: 'destructive', onPress: () => handleRemove(member) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  const handleChangeRole = (member: OrgMember) => {
    const newRole = member.role === 'CREW' ? 'BOOKKEEPER' : 'CREW';
    const roleName = newRole === 'BOOKKEEPER' ? 'Bookkeeper' : 'Crew';

    Alert.alert(
      'Change Role',
      `Change ${member.user?.name || member.user?.email} to ${roleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Make ${roleName}`,
          onPress: async () => {
            if (!orgId) return;
            try {
              await organizationsApi.updateMemberRole(orgId, member.id, newRole);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadMembers();
            } catch {
              Alert.alert('Error', 'Failed to update role.');
            }
          },
        },
      ],
    );
  };

  const handleRemove = (member: OrgMember) => {
    Alert.alert(
      'Remove Member?',
      `${member.user?.name || member.user?.email} will lose access to this organization.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!orgId) return;
            try {
              await organizationsApi.removeMember(orgId, member.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadMembers();
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Failed to remove member.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  const renderMember = ({ item }: { item: OrgMember }) => {
    const roleStyle = ROLE_COLORS[item.role] || ROLE_COLORS.CREW;
    const name = item.user?.name || 'Unnamed';
    const email = item.user?.email || '';
    const isPending = !item.acceptedAt;
    const isOwner = item.role === 'OWNER';

    return (
      <TouchableOpacity
        style={styles.memberRow}
        onLongPress={() => handleMemberAction(item)}
        disabled={isOwner}
        activeOpacity={isOwner ? 1 : 0.7}
      >
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
      </TouchableOpacity>
    );
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title={`Members (${members.length})`} showBack />

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
                title="Invite Member"
                onPress={() => router.push('/settings/invite-member')}
              />
              {members.some((m) => m.role !== 'OWNER') && (
                <Text style={styles.hint}>
                  Long-press a member to change their role or remove them
                </Text>
              )}
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
    gap: spacing.md,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
