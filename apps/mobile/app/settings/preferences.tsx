import React, { useState } from 'react';
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
import { useSettings } from '../../src/hooks/useSettings';
import { colors, spacing, typography, borderRadius } from '../../src/theme';

const EXPENSE_CATEGORIES = [
  { value: null, label: 'None' },
  { value: 'MATERIALS', label: 'Materials' },
  { value: 'LABOR', label: 'Labor' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'SUBCONTRACTOR', label: 'Subcontractor' },
  { value: 'OVERHEAD', label: 'Overhead' },
] as const;

function centsToDollarStr(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function PreferencesScreen() {
  const {
    mileageRateCents,
    notificationsEnabled,
    defaultTaxRate,
    defaultExpenseCategory,
    setMileageRateCents,
    setNotificationsEnabled,
    setDefaultTaxRate,
    setDefaultExpenseCategory,
  } = useSettings();

  const [mileageInput, setMileageInput] = useState(centsToDollarStr(mileageRateCents));
  const [taxInput, setTaxInput] = useState(defaultTaxRate > 0 ? defaultTaxRate.toString() : '');

  const irsRate = centsToDollarStr(IRS_MILEAGE_RATE_CENTS);

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

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header title="Preferences" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleSubtitle}>Receipt processing updates and reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                setNotificationsEnabled(val);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
