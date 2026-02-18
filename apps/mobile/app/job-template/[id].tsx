import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Card, Button } from '../../src/components/ui';
import { useJobTemplate, useDeleteJobTemplate } from '../../src/hooks/useJobTemplates';
import { formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

export default function JobTemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: template, isLoading } = useJobTemplate(id ?? '');
  const deleteMutation = useDeleteJobTemplate();

  const handleUseTemplate = () => {
    if (!template) return;
    router.push({
      pathname: '/job/create',
      params: { templateId: template.id },
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Template', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (isLoading || !template) {
    return (
      <Screen padded={false}>
        <Header title="Template" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const hasBudget = template.budgetTotal || template.budgetMaterials || template.budgetLabor || template.contractValue;

  return (
    <Screen padded={false}>
      <Header title="Template" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Card>
          <Text style={styles.templateName}>{template.name}</Text>
          {template.description && (
            <Text style={styles.description}>{template.description}</Text>
          )}
          {template.customerName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Default Customer</Text>
              <Text style={styles.detailValue}>{template.customerName}</Text>
            </View>
          )}
        </Card>

        {/* Budget info */}
        {hasBudget && (
          <>
            <Text style={styles.sectionTitle}>Budget Defaults</Text>
            <Card>
              {template.budgetTotal != null && (
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Total Budget</Text>
                  <Text style={styles.budgetValue}>{formatMoney(template.budgetTotal)}</Text>
                </View>
              )}
              {template.contractValue != null && (
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Contract Value</Text>
                  <Text style={styles.budgetValue}>{formatMoney(template.contractValue)}</Text>
                </View>
              )}
              {template.budgetMaterials != null && (
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Materials</Text>
                  <Text style={styles.budgetValue}>{formatMoney(template.budgetMaterials)}</Text>
                </View>
              )}
              {template.budgetLabor != null && (
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Labor</Text>
                  <Text style={styles.budgetValue}>{formatMoney(template.budgetLabor)}</Text>
                </View>
              )}
            </Card>
          </>
        )}

        {/* Line Items */}
        {template.lineItems && template.lineItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Line Items</Text>
            <Card>
              {template.lineItems.map((li, index) => (
                <View
                  key={li.id}
                  style={[styles.lineItemRow, index > 0 && styles.lineItemBorder]}
                >
                  <View style={styles.lineItemInfo}>
                    <Text style={styles.lineItemDesc}>{li.description}</Text>
                    {li.category && (
                      <Text style={styles.lineItemMeta}>{li.category}</Text>
                    )}
                  </View>
                  {li.estimatedAmount != null && (
                    <Text style={styles.lineItemAmount}>
                      {formatMoney(li.estimatedAmount)}
                    </Text>
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Notes */}
        {template.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Card>
              <Text style={styles.notesText}>{template.notes}</Text>
            </Card>
          </>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button title="Use Template" onPress={handleUseTemplate} />
        </View>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.primary }]}
            onPress={() => router.push(`/job-template/edit/${id}`)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.error }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    templateName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    detailLabel: { fontSize: 14, color: colors.textMuted },
    detailValue: { fontSize: 14, fontWeight: '500', color: colors.text },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    budgetRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    budgetLabel: { fontSize: 14, color: colors.textSecondary },
    budgetValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    lineItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    lineItemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    lineItemInfo: { flex: 1 },
    lineItemDesc: { fontSize: 15, fontWeight: '500', color: colors.text },
    lineItemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    lineItemAmount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    notesText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    actionRow: { marginTop: spacing.xl },
    secondaryActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    actionBtnText: { fontSize: 14, fontWeight: '600' },
  });
