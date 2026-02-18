import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

export interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

interface QuickActionGridProps {
  actions: QuickAction[];
}

export function QuickActionGrid({ actions }: QuickActionGridProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.route}
          style={styles.card}
          onPress={() => handlePress(action.route)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: action.color + '20' }]}>
            <Ionicons name={action.icon} size={22} color={action.color} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
