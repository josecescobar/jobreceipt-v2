import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input } from '../../../src/components/ui';
import {
  useCostCode,
  useUpdateCostCode,
  useDeleteCostCode,
} from '../../../src/hooks/useCostCodes';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

const CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials' },
  { key: 'LABOR', label: 'Labor' },
  { key: 'EQUIPMENT', label: 'Equipment' },
  { key: 'SUBCONTRACTOR', label: 'Subcontractor' },
  { key: 'OVERHEAD', label: 'Overhead' },
];

export default function EditCostCodeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: costCode, isLoading } = useCostCode(id ?? '');
  const updateCostCode = useUpdateCostCode();
  const deleteCostCode = useDeleteCostCode();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MATERIALS');
  const [error, setError] = useState('');

  useEffect(() => {
    if (costCode) {
      setCode(costCode.code || '');
      setName(costCode.name || '');
      setCategory(costCode.category || 'MATERIALS');
    }
  }, [costCode]);

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      setError('Code and name are required');
      return;
    }
    setError('');

    try {
      await updateCostCode.mutateAsync({
        id: id!,
        updates: {
          code: code.trim(),
          name: name.trim(),
          category,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update cost code');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Cost Code', 'Are you sure you want to delete this cost code?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCostCode.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            const message = err.response?.data?.message || 'Cost code is in use and cannot be deleted';
            Alert.alert('Cannot Delete', message);
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !costCode) {
    return (
      <Screen padded={false}>
        <Header title="Edit Cost Code" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Cost code not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Edit Cost Code" showBack />
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
            title="Save Changes"
            onPress={handleSave}
            loading={updateCostCode.isPending}
            disabled={!code.trim() || !name.trim()}
          />

          <Button
            title="Delete Cost Code"
            onPress={handleDelete}
            variant="danger"
            loading={deleteCostCode.isPending}
            style={styles.deleteButton}
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
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    deleteButton: {
      marginTop: spacing.md,
    },
  });
