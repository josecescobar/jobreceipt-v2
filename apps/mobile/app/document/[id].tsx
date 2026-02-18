import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Card, Badge } from '../../src/components/ui';
import { useDocument, useDeleteDocument } from '../../src/hooks/useDocuments';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const TYPE_LABELS: Record<string, string> = {
  CONTRACT: 'Contract',
  PERMIT: 'Permit',
  INSURANCE: 'Insurance',
  LIEN_WAIVER: 'Lien Waiver',
  W9: 'W-9',
  OTHER: 'Other',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: document, isLoading } = useDocument(id ?? '');
  const deleteDocument = useDeleteDocument();

  const handleDownload = async () => {
    if (!document?.downloadUrl) {
      Alert.alert('Error', 'Download URL not available');
      return;
    }
    try {
      await Linking.openURL(document.downloadUrl);
    } catch {
      Alert.alert('Error', 'Could not open the file');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document? This will also remove the file from storage.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete document');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !document) {
    return (
      <Screen padded={false}>
        <Header title="Document" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Document not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  const linkedEntity = (document as any).job || (document as any).vendor || (document as any).subcontractor;
  const linkedEntityType = (document as any).job ? 'job' : (document as any).vendor ? 'vendor' : (document as any).subcontractor ? 'subcontractor' : null;

  const handleEntityPress = () => {
    if (linkedEntityType === 'job' && document.jobId) {
      router.push(`/job/${document.jobId}`);
    } else if (linkedEntityType === 'vendor' && document.vendorId) {
      router.push(`/vendor/${document.vendorId}`);
    } else if (linkedEntityType === 'subcontractor' && document.subcontractorId) {
      router.push(`/subcontractor/${document.subcontractorId}`);
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Document" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Info Card */}
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Ionicons name="document-text-outline" size={28} color={colors.primary} />
            <View style={styles.headerInfo}>
              <Text style={styles.docName}>{document.name}</Text>
              <Badge
                label={TYPE_LABELS[document.type] || document.type}
                color={colors.primary}
                backgroundColor={colors.primary + '20'}
              />
            </View>
          </View>
        </Card>

        {/* Details Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="document-outline" size={16} color={colors.textMuted} />
            <Text style={styles.detailLabel}>File Type</Text>
            <Text style={styles.detailValue}>{document.fileType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="server-outline" size={16} color={colors.textMuted} />
            <Text style={styles.detailLabel}>File Size</Text>
            <Text style={styles.detailValue}>{formatFileSize(document.fileSize)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.detailLabel}>Uploaded</Text>
            <Text style={styles.detailValue}>{formatDate(document.createdAt)}</Text>
          </View>

          {document.expiresAt && (
            <View style={styles.detailRow}>
              <Ionicons name="alarm-outline" size={16} color={colors.warning} />
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={[styles.detailValue, { color: colors.warning }]}>
                {formatDate(document.expiresAt)}
              </Text>
            </View>
          )}
        </Card>

        {/* Linked Entity Card */}
        {linkedEntity && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Linked To</Text>
            <View style={styles.detailRow}>
              <Ionicons
                name={
                  linkedEntityType === 'job'
                    ? 'briefcase-outline'
                    : linkedEntityType === 'vendor'
                    ? 'storefront-outline'
                    : 'hammer-outline'
                }
                size={16}
                color={colors.textMuted}
              />
              <Text
                style={[styles.detailValue, styles.linkText]}
                onPress={handleEntityPress}
              >
                {linkedEntity.name}
              </Text>
            </View>
          </Card>
        )}

        {/* Notes Card */}
        {document.notes && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{document.notes}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Download / Open"
            onPress={handleDownload}
          />
          <Button
            title="Edit Document"
            onPress={() => router.push(`/document/edit/${document.id}`)}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="Delete Document"
            onPress={handleDelete}
            variant="danger"
            loading={deleteDocument.isPending}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    card: {
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    docName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textMuted,
      minWidth: 80,
    },
    detailValue: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    linkText: {
      color: colors.primary,
    },
    notesText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    actions: {
      marginTop: spacing.md,
    },
    actionButton: {
      marginTop: spacing.md,
    },
  });
