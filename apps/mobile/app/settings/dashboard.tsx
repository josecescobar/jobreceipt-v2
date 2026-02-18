import React, { useMemo, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { useSettings, type DashboardSection } from '../../src/hooks/useSettings';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

const SECTION_LABELS: Record<string, string> = {
  quickActions: 'Quick Actions',
  templateQuickAdd: 'Template Quick-Add',
  syncStatus: 'Sync Status',
  statsRow: 'Stats Overview',
  weeklySpending: 'Weekly Spending',
  unpaidInvoices: 'Unpaid Invoices',
  cashFlow: 'Cash Flow Forecast',
  todaySchedule: "Today's Schedule",
  monthlySpending: 'Monthly Spending',
  categoryBreakdown: 'Category Breakdown',
  topJobBudget: 'Top Job Budget',
  recentActivity: 'Recent Activity',
};

export default function DashboardCustomizeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { dashboardLayout, setDashboardLayout, resetDashboardLayout } = useSettings();

  const handleDragEnd = useCallback(
    ({ data }: { data: DashboardSection[] }) => {
      setDashboardLayout(data);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setDashboardLayout],
  );

  const handleToggle = useCallback(
    (id: string, value: boolean) => {
      const updated = dashboardLayout.map((s) =>
        s.id === id ? { ...s, visible: value } : s,
      );
      setDashboardLayout(updated);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [dashboardLayout, setDashboardLayout],
  );

  const handleReset = useCallback(() => {
    resetDashboardLayout();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [resetDashboardLayout]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DashboardSection>) => (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={drag}
          disabled={isActive}
          style={[styles.row, isActive && styles.rowActive]}
        >
          <Ionicons
            name="menu-outline"
            size={22}
            color={colors.textMuted}
            style={styles.dragHandle}
          />
          <Text style={styles.rowLabel} numberOfLines={1}>
            {SECTION_LABELS[item.id] ?? item.id}
          </Text>
          <Switch
            value={item.visible}
            onValueChange={(val) => handleToggle(item.id, val)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    ),
    [colors, styles, handleToggle],
  );

  const keyExtractor = useCallback((item: DashboardSection) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <Text style={styles.infoText}>
        Drag to reorder, toggle to show/hide
      </Text>
    ),
    [styles],
  );

  const ListFooter = useMemo(
    () => (
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <Text style={styles.resetButtonText}>Reset to Default</Text>
      </TouchableOpacity>
    ),
    [styles, handleReset],
  );

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <Header
        title="Customize Dashboard"
        showBack
        rightAction={{ icon: 'refresh-outline', onPress: handleReset }}
      />

      <View style={styles.flex}>
        <DraggableFlatList
          data={dashboardLayout}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    infoText: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowActive: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.primary,
    },
    dragHandle: {
      marginRight: spacing.md,
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginRight: spacing.md,
    },
    resetButton: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    resetButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  });
