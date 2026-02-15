import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, MIN_TOUCH_TARGET } from '../../theme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export function SettingsRow({ icon, label, value, onPress, danger }: SettingsRowProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.error : colors.textSecondary}
        style={styles.icon}
      />
      <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
      {value && <Text style={styles.value}>{value}</Text>}
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  dangerLabel: {
    color: colors.error,
  },
  value: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
});
