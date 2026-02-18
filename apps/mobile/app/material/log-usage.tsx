import React, { useState, useMemo } from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useLogMaterialUsage } from '../../src/hooks/useMaterials';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function LogMaterialUsageScreen() {
  const router = useRouter();
  const { materialItemId, materialName } = useLocalSearchParams<{
    materialItemId: string;
    materialName?: string;
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const logUsage = useLogMaterialUsage();

  const [qtyStr, setQtyStr] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const qty = parseFloat(qtyStr || '0');
  const canSubmit = !!materialItemId && qty > 0;

  const handleSubmit = async () => {
    if (!materialItemId) {
      setError('Material is required');
      return;
    }
    if (qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    setError('');

    try {
      await logUsage.mutateAsync({
        materialItemId,
        qty,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log usage');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Log Usage" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Material name */}
          {materialName && (
            <Text style={styles.materialName}>
              {decodeURIComponent(materialName)}
            </Text>
          )}

          {/* Quantity */}
          <Input
            label="Quantity *"
            value={qtyStr}
            onChangeText={setQtyStr}
            placeholder="Enter quantity used"
            keyboardType="decimal-pad"
          />

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes (optional)"
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Log Usage"
            onPress={handleSubmit}
            loading={logUsage.isPending}
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
    materialName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
