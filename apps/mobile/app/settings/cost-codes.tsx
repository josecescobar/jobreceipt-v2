import React, { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { EmptyState, Button } from '../../src/components/ui';
import { useCostCodes, useSeedDefaultCostCodes } from '../../src/hooks/useCostCodes';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { CostCode } from '@jobreceipt/shared';

const CATEGORY_ORDER = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  MATERIALS: 'Materials',
  LABOR: 'Labor',
  EQUIPMENT: 'Equipment',
  SUBCONTRACTOR: 'Subcontractor',
  OVERHEAD: 'Overhead',
};

interface Section {
  title: string;
  data: CostCode[];
}

export default function CostCodesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: costCodes, isLoading } = useCostCodes();
  const seedMutation = useSeedDefaultCostCodes();

  const sections: Section[] = useMemo(() => {
    if (!costCodes || costCodes.length === 0) return [];
    const grouped: Record<string, CostCode[]> = {};
    for (const code of costCodes) {
      const cat = code.category || 'OVERHEAD';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(code);
    }
    return CATEGORY_ORDER
      .filter((cat) => grouped[cat] && grouped[cat].length > 0)
      .map((cat) => ({
        title: CATEGORY_LABELS[cat] || cat,
        data: grouped[cat],
      }));
  }, [costCodes]);

  const handleSeed = async () => {
    try {
      await seedMutation.mutateAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // handled by query error
    }
  };

  if (isLoading) {
    return (
      <Screen padded={false}>
        <Header title="Cost Codes" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (!costCodes || costCodes.length === 0) {
    return (
      <Screen padded={false}>
        <Header
          title="Cost Codes"
          showBack
          rightAction={{ icon: 'add', onPress: () => router.push('/cost-code/create') }}
        />
        <EmptyState
          title="No Cost Codes"
          message="Add your own cost codes or seed the defaults to get started."
          actionLabel={seedMutation.isPending ? 'Seeding...' : 'Seed Default Codes'}
          onAction={handleSeed}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header
        title="Cost Codes"
        showBack
        rightAction={{ icon: 'add', onPress: () => router.push('/cost-code/create') }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/cost-code/edit/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
    list: {
      paddingBottom: spacing.xxxl,
    },
    sectionHeader: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    code: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      width: 90,
      marginRight: spacing.md,
    },
    name: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
  });
