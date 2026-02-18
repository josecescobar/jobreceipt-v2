import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useExpenseTemplates } from '../../hooks/useExpenseTemplates';
import { formatMoney } from '../../lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

export function TemplateQuickAddRow() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data, isLoading } = useExpenseTemplates();

  const templates = useMemo(() => {
    const all = (data as any)?.data ?? [];
    return all.slice(0, 5);
  }, [data]);

  if (isLoading || templates.length === 0) return null;

  const handlePress = (template: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/expense/create',
      params: {
        templateName: template.name,
        templateDescription: template.description || '',
        templateAmount: template.amount?.toString() || '',
        templateCategory: template.category || '',
        templateMerchant: template.merchantName || '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Add</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {templates.map((template: any) => (
          <TouchableOpacity
            key={template.id}
            style={styles.chip}
            onPress={() => handlePress(template)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipName} numberOfLines={1}>
              {template.name}
            </Text>
            {template.amount ? (
              <Text style={styles.chipAmount}>{formatMoney(template.amount)}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    scrollContent: {
      paddingRight: spacing.md,
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    chipName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      maxWidth: 120,
    },
    chipAmount: {
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
  });
