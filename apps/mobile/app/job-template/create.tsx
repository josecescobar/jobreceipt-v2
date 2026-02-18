import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useCreateJobTemplate } from '../../src/hooks/useJobTemplates';
import { dollarsToCents } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

interface LineItem {
  key: string;
  description: string;
  category: string;
  estimatedAmount: string;
}

let lineItemKey = 0;
function nextKey() {
  return `tli-${++lineItemKey}`;
}

export default function CreateJobTemplateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createMutation = useCreateJobTemplate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [budgetMaterials, setBudgetMaterials] = useState('');
  const [budgetLabor, setBudgetLabor] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      { key: nextKey(), description: '', category: '', estimatedAmount: '' },
    ]);
  };

  const handleRemoveItem = (key: string) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleUpdateItem = (key: string, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    setError('');

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        customerName: customerName.trim() || undefined,
        budgetTotal: budgetTotal ? dollarsToCents(parseFloat(budgetTotal)) : undefined,
        budgetMaterials: budgetMaterials ? dollarsToCents(parseFloat(budgetMaterials)) : undefined,
        budgetLabor: budgetLabor ? dollarsToCents(parseFloat(budgetLabor)) : undefined,
        contractValue: contractValue ? dollarsToCents(parseFloat(contractValue)) : undefined,
        notes: notes.trim() || undefined,
        lineItems: lineItems
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description.trim(),
            category: item.category.trim() || undefined,
            estimatedAmount: item.estimatedAmount
              ? dollarsToCents(parseFloat(item.estimatedAmount))
              : undefined,
          })),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create template');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Template" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Template Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Kitchen Remodel"
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Template description"
            multiline
            numberOfLines={2}
          />

          <Input
            label="Default Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Optional"
          />

          <Text style={styles.sectionTitle}>Budget Defaults</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Total Budget"
                value={budgetTotal}
                onChangeText={setBudgetTotal}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Contract Value"
                value={contractValue}
                onChangeText={setContractValue}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Materials"
                value={budgetMaterials}
                onChangeText={setBudgetMaterials}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Labor"
                value={budgetLabor}
                onChangeText={setBudgetLabor}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.lineItemsHeader}>
            <Text style={styles.sectionTitle}>Line Items</Text>
          </View>

          {lineItems.map((item) => (
            <View key={item.key} style={styles.lineItemCard}>
              <View style={styles.lineItemTopRow}>
                <View style={styles.lineItemDescWrap}>
                  <Input
                    label="Description"
                    value={item.description}
                    onChangeText={(val) => handleUpdateItem(item.key, 'description', val)}
                    placeholder="e.g. Cabinets"
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeItemBtn}
                  onPress={() => handleRemoveItem(item.key)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Category"
                    value={item.category}
                    onChangeText={(val) => handleUpdateItem(item.key, 'category', val)}
                    placeholder="Optional"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Est. Amount"
                    value={item.estimatedAmount}
                    onChangeText={(val) => handleUpdateItem(item.key, 'estimatedAmount', val)}
                    keyboardType="decimal-pad"
                    prefix="$"
                    placeholder="0.00"
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={handleAddItem} style={styles.addItemBtn}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addItemText}>Add Line Item</Text>
          </TouchableOpacity>

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Template notes..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Template"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={!name.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    halfInput: { flex: 1 },
    lineItemsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    lineItemCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lineItemTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
    lineItemDescWrap: { flex: 1 },
    removeItemBtn: { marginTop: spacing.lg, marginLeft: spacing.sm },
    addItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    addItemText: { fontSize: 14, fontWeight: '500', color: colors.primary },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
