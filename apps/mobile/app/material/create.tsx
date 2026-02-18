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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useCreateMaterial } from '../../src/hooks/useMaterials';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const UNIT_OPTIONS = [
  { value: 'ea', label: 'ea' },
  { value: 'lf', label: 'lf' },
  { value: 'sqft', label: 'sqft' },
  { value: 'lb', label: 'lb' },
  { value: 'bag', label: 'bag' },
  { value: 'box', label: 'box' },
  { value: 'roll', label: 'roll' },
  { value: 'gal', label: 'gal' },
] as const;

const CATEGORY_OPTIONS = [
  'LUMBER',
  'ELECTRICAL',
  'PLUMBING',
  'ROOFING',
  'HARDWARE',
  'PAINT',
  'FASTENERS',
  'CONCRETE',
  'INSULATION',
  'DRYWALL',
  'FLOORING',
  'TOOLS',
  'SAFETY',
  'OTHER',
] as const;

export default function CreateMaterialScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createMaterial = useCreateMaterial();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('ea');
  const [unitCostStr, setUnitCostStr] = useState('');
  const [purchasedQtyStr, setPurchasedQtyStr] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [costCodeId, setCostCodeId] = useState('');
  const [jobIdInput, setJobIdInput] = useState(jobId || '');
  const [sku, setSku] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const unitCostCents = Math.round(parseFloat(unitCostStr || '0') * 100);
  const purchasedQty = parseFloat(purchasedQtyStr || '0');
  const canSubmit =
    !!jobIdInput && name.trim().length > 0 && unitCostCents >= 0;

  const handleSubmit = async () => {
    if (!jobIdInput) {
      setError('Job is required');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');

    try {
      await createMaterial.mutateAsync({
        jobId: jobIdInput,
        name: name.trim(),
        sku: sku.trim() || undefined,
        unit,
        unitCost: unitCostCents,
        category: category || undefined,
        costCodeId: costCodeId.trim() || undefined,
        purchasedQty: purchasedQty || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create material',
      );
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Add Material" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. 2x4 Lumber, 12/2 Romex Wire"
          />

          {/* Job ID (if not provided via params) */}
          {!jobId && (
            <Input
              label="Job ID *"
              value={jobIdInput}
              onChangeText={setJobIdInput}
              placeholder="Enter job ID"
            />
          )}

          {/* Unit selector */}
          <Text style={styles.sectionLabel}>Unit</Text>
          <View style={styles.chipGrid}>
            {UNIT_OPTIONS.map((opt) => {
              const active = unit === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setUnit(opt.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Unit Cost */}
          <Input
            label="Unit Cost *"
            value={unitCostStr}
            onChangeText={setUnitCostStr}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
          />

          {/* Purchased Qty */}
          <Input
            label="Purchased Quantity"
            value={purchasedQtyStr}
            onChangeText={setPurchasedQtyStr}
            placeholder="0"
            keyboardType="decimal-pad"
          />

          {/* Category */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORY_OPTIONS.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(active ? undefined : cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cost Code */}
          <Input
            label="Cost Code ID"
            value={costCodeId}
            onChangeText={setCostCodeId}
            placeholder="Enter cost code ID (optional)"
          />

          {/* SKU */}
          <Input
            label="SKU"
            value={sku}
            onChangeText={setSku}
            placeholder="Enter SKU (optional)"
          />

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Material"
            onPress={handleSubmit}
            loading={createMaterial.isPending}
            disabled={!canSubmit}
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
    sectionLabel: {
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
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.white,
      fontWeight: '600',
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
