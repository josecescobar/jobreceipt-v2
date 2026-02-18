import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDocuments } from '../../hooks/useDocuments';
import { Badge, EmptyState, LoadingScreen } from '../ui';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';
import type { Document } from '@jobreceipt/shared';

interface DocumentListProps {
  jobId?: string;
  vendorId?: string;
  subcontractorId?: string;
}

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

export function DocumentList({ jobId, vendorId, subcontractorId }: DocumentListProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const queryParams = useMemo(
    () => ({
      ...(jobId ? { jobId } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(subcontractorId ? { subcontractorId } : {}),
    }),
    [jobId, vendorId, subcontractorId],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useDocuments(queryParams);

  const documents = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  const handleAddDocument = () => {
    const params: Record<string, string> = {};
    if (jobId) params.jobId = jobId;
    if (vendorId) params.vendorId = vendorId;
    if (subcontractorId) params.subcontractorId = subcontractorId;

    const query = new URLSearchParams(params).toString();
    router.push(`/document/upload${query ? `?${query}` : ''}`);
  };

  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/document/${item.id}`)}
      activeOpacity={0.7}
    >
      <Ionicons name="document-outline" size={20} color={colors.textMuted} />
      <View style={styles.rowInfo}>
        <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.rowMeta}>
          <Badge
            label={TYPE_LABELS[item.type] || item.type}
            color={colors.primary}
            backgroundColor={colors.primary + '20'}
          />
          <Text style={styles.fileSize}>{formatFileSize(item.fileSize)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Documents"
            message="Upload contracts, permits, and other files."
            actionLabel="Add Document"
            onAction={handleAddDocument}
          />
        }
      />
      {documents.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDocument}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    rowInfo: {
      flex: 1,
    },
    docName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    rowMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    fileSize: {
      fontSize: 12,
      color: colors.textMuted,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  });
