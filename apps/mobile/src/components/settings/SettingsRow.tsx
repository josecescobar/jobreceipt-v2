import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, spacing, MIN_TOUCH_TARGET } from '../../theme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

export function SettingsRow({ icon, label, subtitle, value, onPress, danger, showChevron, rightElement }: SettingsRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const Container = onPress ? TouchableOpacity : View;
  const chevronVisible = showChevron ?? (onPress && !danger);

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
      <View style={styles.labelContainer}>
        <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.value}>{value}</Text>}
      {rightElement}
      {chevronVisible && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Container>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
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
