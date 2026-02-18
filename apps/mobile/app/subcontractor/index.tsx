import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header } from '../../src/components/layout';
import { Input, FAB, EmptyState, LoadingScreen, Badge } from '../../src/components/ui';
import { useSubcontractors } from '../../src/hooks/useSubcontractors';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { Subcontractor } from '@jobreceipt/shared';

export default function SubcontractorListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text.trim());
    }, 300);
  }, []);

  const queryParams = useMemo(
    () => (debouncedSearch ? { search: debouncedSearch } : {}),
    [debouncedSearch],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useSubcontractors(queryParams);

  const subcontractors = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  const renderItem = ({ item }: { item: Subcontractor }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/subcontractor/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.subName}>{item.name}</Text>
          {item.trade && (
            <Text style={styles.trade}>{item.trade}</Text>
          )}
          {item.companyName && (
            <Text style={styles.companyName}>{item.companyName}</Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <Badge
            label={item.w9Received ? 'W9' : 'No W9'}
            color={item.w9Received ? colors.success : colors.error}
            backgroundColor={item.w9Received ? colors.success + '20' : colors.error + '20'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen padded={false}>
      <Header
        title="Subcontractors"
        showBack
        rightAction={{ icon: 'add', onPress: () => router.push('/subcontractor/create') }}
      />
      <FlatList
        data={subcontractors}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search subcontractors..."
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Subcontractors"
            message="Add your first subcontractor to track subs and 1099 readiness."
            actionLabel="Add Subcontractor"
            onAction={() => router.push('/subcontractor/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/subcontractor/create')}
        icon="add"
        label="Add Sub"
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    cardRight: {
      alignItems: 'flex-end',
    },
    subName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    trade: {
      fontSize: 14,
      color: colors.primary,
      marginTop: 2,
    },
    companyName: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
