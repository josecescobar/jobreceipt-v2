import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useCreateCostCode } from '../../src/hooks/useCostCodes';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials' },
  { key: 'LABOR', label: 'Labor' },
  { key: 'EQUIPMENT', label: 'Equipment' },
  { key: 'SUBCONTRACTOR', label: 'Subcontractor' },
  { key: 'OVERHEAD', label: 'Overhead' },
];

export default function CreateCostCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createCostCode = useCreateCostCode();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MATERIALS');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are required');
      return;
    }
    setError('');

    try {
      await createCostCode.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        category,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create cost code');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Cost Code" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Code *"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. 06-11-00"
            autoCapitalize="characters"
          />

          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Framing Lumber"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Cost Code"
            onPress={handleSubmit}
            loading={createCostCode.isPending}
            disabled={!code.trim() || !name.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
