import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useUploadDocument } from '../../src/hooks/useDocuments';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const DOCUMENT_TYPES = [
  { key: 'CONTRACT', label: 'Contract' },
  { key: 'PERMIT', label: 'Permit' },
  { key: 'INSURANCE', label: 'Insurance' },
  { key: 'LIEN_WAIVER', label: 'Lien Waiver' },
  { key: 'W9', label: 'W-9' },
  { key: 'OTHER', label: 'Other' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDocumentScreen() {
  const router = useRouter();
  const { jobId, vendorId, subcontractorId } = useLocalSearchParams<{
    jobId?: string;
    vendorId?: string;
    subcontractorId?: string;
  }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const uploadDocument = useUploadDocument();

  const [file, setFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('OTHER');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });

      // Auto-fill name from file name (without extension)
      if (!name) {
        const baseName = asset.name.replace(/\.[^.]+$/, '');
        setName(baseName);
      }

      Haptics.selectionAsync();
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!name.trim()) {
      setError('Document name is required');
      return;
    }
    setError('');

    try {
      await uploadDocument.mutateAsync({
        fileName: file.name,
        contentType: file.mimeType,
        fileUri: file.uri,
        fileSize: file.size,
        name: name.trim(),
        type: selectedType || undefined,
        jobId: jobId || undefined,
        vendorId: vendorId || undefined,
        subcontractorId: subcontractorId || undefined,
        expiresAt: expiresAt.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload document');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Upload Document" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* File Picker */}
          <Text style={styles.label}>File *</Text>
          <TouchableOpacity
            style={[styles.filePicker, file && styles.filePickerSelected]}
            onPress={handlePickFile}
            activeOpacity={0.7}
          >
            {file ? (
              <View style={styles.fileInfo}>
                <Ionicons name="document-attach-outline" size={24} color={colors.primary} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setFile(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.filePickerEmpty}>
                <Ionicons name="cloud-upload-outline" size={32} color={colors.textMuted} />
                <Text style={styles.filePickerText}>Tap to select a file</Text>
                <Text style={styles.filePickerHint}>PDF, images, documents, etc.</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. General Contractor Agreement"
            error={error && !name.trim() ? error : undefined}
          />

          {/* Type Chip Grid */}
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

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this document..."
            multiline
            numberOfLines={3}
          />

          {/* Expiry Date */}
          <Input
            label="Expiry Date (optional)"
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          {error && file && name.trim() ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <Button
            title={uploadDocument.isPending ? 'Uploading...' : 'Upload Document'}
            onPress={handleSubmit}
            loading={uploadDocument.isPending}
            disabled={!file || !name.trim()}
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
    filePicker: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginBottom: spacing.lg,
      overflow: 'hidden',
    },
    filePickerSelected: {
      borderStyle: 'solid',
      borderColor: colors.primary,
    },
    filePickerEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
    },
    filePickerText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    filePickerHint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      gap: spacing.sm,
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    fileSize: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
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
