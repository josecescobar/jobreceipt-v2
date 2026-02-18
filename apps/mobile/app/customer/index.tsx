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
import { useCustomers } from '../../src/hooks/useCustomers';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { Customer } from '@jobreceipt/shared';

export default function CustomerListScreen() {
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
    useCustomers(queryParams);

  const customers = useMemo(
    () => data?.pages?.flatMap((p) => p.data) ?? [],
    [data],
  );

  if (isLoading) return <LoadingScreen />;

  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/customer/${item.id}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.customerName}>{item.name}</Text>
      {item.companyName && (
        <Text style={styles.companyName}>{item.companyName}</Text>
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
        title="Customers"
        showBack
        rightAction={{ icon: 'add', onPress: () => router.push('/customer/create') }}
      />
      <FlatList
        data={customers}
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
              placeholder="Search customers..."
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Customers"
            message="Add your first customer to track clients and job history."
            actionLabel="Add Customer"
            onAction={() => router.push('/customer/create')}
          />
        }
      />

      <FAB
        onPress={() => router.push('/customer/create')}
        icon="add"
        label="Add Customer"
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
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    companyName: {
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
