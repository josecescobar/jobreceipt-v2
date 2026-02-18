import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { EmptyState } from '../../src/components/ui';
import { useReportTemplates } from '../../src/hooks/useReports';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';
import type { ReportTemplate } from '../../src/api/reports';

// Map Eva-style icon names from the API to Ionicons equivalents
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'briefcase-outline': 'briefcase-outline',
  'pie-chart-outline': 'pie-chart-outline',
  'people-outline': 'people-outline',
  'car-outline': 'car-outline',
  'calendar-outline': 'calendar-outline',
  'cash-outline': 'cash-outline',
  'receipt-outline': 'receipt-outline',
  'document-text-outline': 'document-text-outline',
  'trending-up-outline': 'trending-up-outline',
  'clipboard-outline': 'clipboard-outline',
  'bar-chart-outline': 'bar-chart-outline',
  'wallet-outline': 'wallet-outline',
  'construct-outline': 'construct-outline',
  'time-outline': 'time-outline',
  'layers-outline': 'layers-outline',
};

function getIonIcon(apiIcon: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[apiIcon] ?? 'document-text-outline';
}

export default function ReportsIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: templates, isLoading, refetch, isRefetching } = useReportTemplates();

  const handleTemplatePress = useCallback(
    (template: ReportTemplate) => {
      router.push({
        pathname: '/reports/generate',
        params: { type: template.type, label: template.label },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ReportTemplate }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleTemplatePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIonIcon(item.icon)}
            size={28}
            color={colors.primary}
          />
        </View>
        <Text style={styles.cardLabel} numberOfLines={2}>
          {item.label}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {item.description}
        </Text>
      </TouchableOpacity>
    ),
    [styles, colors, handleTemplatePress],
  );

  return (
    <Screen padded={false}>
      <Header title="Reports" showBack />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.type}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title="No Report Templates"
              message="Report templates are not available right now. Pull to refresh."
            />
          }
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    row: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    cardLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    cardDescription: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
