import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, LoadingScreen } from '../../../src/components/ui';
import { useDocument, useUpdateDocument } from '../../../src/hooks/useDocuments';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

const DOCUMENT_TYPES = [
  { key: 'CONTRACT', label: 'Contract' },
  { key: 'PERMIT', label: 'Permit' },
  { key: 'INSURANCE', label: 'Insurance' },
  { key: 'LIEN_WAIVER', label: 'Lien Waiver' },
  { key: 'W9', label: 'W-9' },
  { key: 'OTHER', label: 'Other' },
];

export default function EditDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: document, isLoading } = useDocument(id ?? '');
  const updateDocument = useUpdateDocument();

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('OTHER');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (document) {
      setName(document.name);
      setSelectedType(document.type);
      setNotes(document.notes || '');
      setExpiresAt(document.expiresAt ? document.expiresAt.split('T')[0] : '');
    }
  }, [document]);

  if (isLoading || !document) return <LoadingScreen />;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Document name is required');
      return;
    }
    setError('');

    try {
      await updateDocument.mutateAsync({
        id: id!,
        updates: {
          name: name.trim(),
          type: selectedType,
          notes: notes.trim() || undefined,
          expiresAt: expiresAt.trim() || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update document');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Edit Document" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="Document name"
            error={error && !name.trim() ? error : undefined}
          />

          <Text style={styles.label}>Document Type</Text>
          <View style={styles.chipGrid}>
            {DOCUMENT_TYPES.map((dt) => {
              const isSelected = selectedType === dt.key;
              return (
                <TouchableOpacity
                  key={dt.key}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedType(dt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
          />

          <Input
            label="Expiry Date (optional)"
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          {error && name.trim() ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={updateDocument.isPending}
            disabled={!name.trim()}
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
