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
import { Input, FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import { useVendors } from '../../src/hooks/useVendors';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { Vendor } from '@jobreceipt/shared';

export default function VendorListScreen() {
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
    useVendors(queryParams);

  const vendors = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  const renderItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/vendor/${item.id}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.vendorName}>{item.name}</Text>
      {item.contactName && (
        <Text style={styles.contactName}>{item.contactName}</Text>
      )}
      <View style={styles.contactRow}>
        {item.phone && <Text style={styles.contactInfo}>{item.phone}</Text>}
        {item.phone && item.email && <Text style={styles.contactDivider}> | </Text>}
        {item.email && <Text style={styles.contactInfo}>{item.email}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen padded={false}>
      <Header
        title="Vendors"
        showBack
        rightAction={{ icon: 'add', onPress: () => router.push('/vendor/create') }}
      />
      <FlatList
        data={vendors}
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
              placeholder="Search vendors..."
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Vendors"
            message="Add your first vendor to track suppliers and material costs."
            actionLabel="Add Vendor"
            onAction={() => router.push('/vendor/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/vendor/create')}
        icon="add"
        label="Add Vendor"
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
    vendorName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    contactName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    contactInfo: {
      fontSize: 13,
      color: colors.textMuted,
    },
    contactDivider: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
