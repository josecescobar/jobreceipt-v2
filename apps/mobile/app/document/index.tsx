import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { Input, FAB, EmptyState, LoadingScreen, FilterChip, Badge } from '../../src/components/ui';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { Document } from '@jobreceipt/shared';

const DOCUMENT_TYPES = [
  { key: '', label: 'All' },
  { key: 'CONTRACT', label: 'Contract' },
  { key: 'PERMIT', label: 'Permit' },
  { key: 'INSURANCE', label: 'Insurance' },
  { key: 'LIEN_WAIVER', label: 'Lien Waiver' },
  { key: 'W9', label: 'W-9' },
  { key: 'OTHER', label: 'Other' },
];

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DocumentListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text.trim());
    }, 300);
  }, []);

  const queryParams = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(selectedType ? { type: selectedType } : {}),
    }),
    [debouncedSearch, selectedType],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useDocuments(queryParams);

  const documents = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  const getEntityName = (item: Document & { job?: { name: string } | null; vendor?: { name: string } | null; subcontractor?: { name: string } | null }) => {
    if (item.job) return item.job.name;
    if (item.vendor) return item.vendor.name;
    if (item.subcontractor) return item.subcontractor.name;
    return null;
  };

  const renderItem = ({ item }: { item: Document & { job?: { name: string } | null; vendor?: { name: string } | null; subcontractor?: { name: string } | null } }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/document/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="document-text-outline" size={22} color={colors.primary} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
          <Badge
            label={TYPE_LABELS[item.type] || item.type}
            color={colors.primary}
            backgroundColor={colors.primary + '20'}
          />
        </View>
      </View>
      <View style={styles.cardBody}>
        {getEntityName(item) && (
          <View style={styles.metaRow}>
            <Ionicons name="link-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{getEntityName(item)}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Ionicons name="document-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatFileSize(item.fileSize)}</Text>
          <Text style={styles.metaDot}> -- </Text>
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen padded={false}>
      <Header
        title="Documents"
        showBack
        rightAction={{ icon: 'add', onPress: () => router.push('/document/upload') }}
      />

      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <Input
                placeholder="Search documents..."
                value={searchText}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {DOCUMENT_TYPES.map((dt) => (
                <FilterChip
                  key={dt.key}
                  label={dt.label}
                  active={selectedType === dt.key}
                  onPress={() => setSelectedType(selectedType === dt.key ? '' : dt.key)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Documents"
            message="Upload contracts, permits, insurance certificates, and other important files."
            actionLabel="Upload Document"
            onAction={() => router.push('/document/upload')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/document/upload')}
        icon="cloud-upload-outline"
        label="Upload"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      padding: spacing.lg,
      paddingBottom: 100,
    },
    searchContainer: {
      marginBottom: spacing.sm,
    },
    filterRow: {
      paddingBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    cardHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    docName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    cardBody: {
      paddingLeft: 30,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    metaText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    metaDot: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
