import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { Screen, Header } from '../../src/components/layout';
import { Input, Button } from '../../src/components/ui';
import { SettingsSection } from '../../src/components/settings';
import { useSettings, type NotificationPrefs } from '../../src/hooks/useSettings';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
];

const EXPENSE_CATEGORIES = [
  { value: null, label: 'None' },
  { value: 'MATERIALS', label: 'Materials' },
  { value: 'LABOR', label: 'Labor' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'SUBCONTRACTOR', label: 'Subcontractor' },
  { value: 'OVERHEAD', label: 'Overhead' },
] as const;

const NOTIFICATION_TYPES: Array<{
  key: keyof NotificationPrefs;
  label: string;
  subtitle: string;
}> = [
  { key: 'receiptProcessed', label: 'Receipt Processed', subtitle: 'When a scanned receipt finishes processing' },
  { key: 'budgetAlerts', label: 'Budget Alerts', subtitle: 'When a job hits 80% or 100% of budget' },
  { key: 'expenseApproval', label: 'Expense Approval', subtitle: 'When your expense is approved or rejected' },
  { key: 'reviewReminders', label: 'Review Reminders', subtitle: 'Daily reminders for unreviewed receipts' },
  { key: 'recurringExpenses', label: 'Recurring Expenses', subtitle: 'When a recurring expense is auto-created' },
];

function centsToDollarStr(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    mileageRateCents,
    notifications,
    defaultTaxRate,
    defaultExpenseCategory,
    themeMode,
    setMileageRateCents,
    setNotificationPref,
    setAllNotifications,
    setDefaultTaxRate,
    setDefaultExpenseCategory,
    setThemeMode,
  } = useSettings();

  const [mileageInput, setMileageInput] = useState(centsToDollarStr(mileageRateCents));
  const [taxInput, setTaxInput] = useState(defaultTaxRate > 0 ? defaultTaxRate.toString() : '');

  const irsRate = centsToDollarStr(IRS_MILEAGE_RATE_CENTS);

  const allEnabled = Object.values(notifications).every(Boolean);
  const noneEnabled = Object.values(notifications).every((v) => !v);

  const handleMileageSave = () => {
    const parsed = parseFloat(mileageInput);
    if (isNaN(parsed) || parsed <= 0) {
      setMileageInput(centsToDollarStr(mileageRateCents));
      return;
    }
    setMileageRateCents(Math.round(parsed * 100));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleResetMileage = () => {
    setMileageRateCents(IRS_MILEAGE_RATE_CENTS);
    setMileageInput(centsToDollarStr(IRS_MILEAGE_RATE_CENTS));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTaxSave = () => {
    const parsed = parseFloat(taxInput);
    if (taxInput === '' || isNaN(parsed)) {
      setDefaultTaxRate(0);
      setTaxInput('');
      return;
    }
    const clamped = Math.min(Math.max(parsed, 0), 100);
    setDefaultTaxRate(clamped);
    setTaxInput(clamped > 0 ? clamped.toString() : '');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCategorySelect = (value: string | null) => {
    setDefaultExpenseCategory(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMasterToggle = (val: boolean) => {
    setAllNotifications(val);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Preferences" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Appearance">
          <View style={styles.categoryGrid}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themeMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => {
                    setThemeMode(opt.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SettingsSection>

        <SettingsSection title="Mileage">
          <View style={styles.sectionContent}>
            <Input
              label="Rate per mile"
              value={mileageInput}
              onChangeText={setMileageInput}
              onBlur={handleMileageSave}
              keyboardType="decimal-pad"
              prefix="$"
              placeholder="0.00"
            />
            <TouchableOpacity onPress={handleResetMileage} style={styles.resetLink}>
              <Text style={styles.resetText}>Reset to IRS rate (${irsRate}/mi)</Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>

        <SettingsSection title="Tax">
          <View style={styles.sectionContent}>
            <Input
              label="Default tax rate"
              value={taxInput}
              onChangeText={setTaxInput}
              onBlur={handleTaxSave}
              keyboardType="decimal-pad"
              prefix="%"
              placeholder="0"
            />
            <Text style={styles.hint}>
              Applied automatically when creating new expenses. Set to 0 or leave blank to disable.
            </Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Default Expense Category">
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = defaultExpenseCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => handleCategorySelect(cat.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.categoryHint}>
            Pre-selects this category when creating new expenses.
          </Text>
        </SettingsSection>

        <SettingsSection title="Notifications">
          {/* Master toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleSubtitle}>
                {allEnabled ? 'All enabled' : noneEnabled ? 'All disabled' : 'Some enabled'}
              </Text>
            </View>
            <Switch
              value={!noneEnabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {/* Per-type toggles */}
          {NOTIFICATION_TYPES.map((nt) => (
            <View key={nt.key} style={styles.subToggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.subToggleLabel}>{nt.label}</Text>
                <Text style={styles.toggleSubtitle}>{nt.subtitle}</Text>
              </View>
              <Switch
                value={notifications[nt.key]}
                onValueChange={(val) => {
                  setNotificationPref(nt.key, val);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  sectionContent: {
    padding: spacing.lg,
  },
  resetLink: {
    marginTop: -spacing.sm,
  },
  resetText: {
    fontSize: 14,
    color: colors.primary,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryTextSelected: {
    color: colors.primary,
  },
  categoryHint: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  subToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  subToggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
