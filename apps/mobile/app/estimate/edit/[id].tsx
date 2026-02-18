import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import { useEstimate, useUpdateEstimate } from '../../../src/hooks/useEstimates';
import { dollarsToCents, centsToDollars, formatMoney } from '../../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

interface LineItem {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

let lineItemKey = 0;
function nextKey() {
  return `li-${++lineItemKey}`;
}

export default function EditEstimateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: estimate, isLoading } = useEstimate(id ?? '');
  const updateEstimate = useUpdateEstimate();

  const [issueDate, setIssueDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (estimate) {
      setIssueDate(new Date(estimate.issueDate).toISOString().split('T')[0]);
      setExpiresAt(
        estimate.expiresAt ? new Date(estimate.expiresAt).toISOString().split('T')[0] : '',
      );
      setNotes(estimate.notes || '');
      setTaxRate(estimate.taxRate > 0 ? (estimate.taxRate * 100).toString() : '');
      setLineItems(
        (estimate.lineItems ?? []).map((item) => ({
          key: nextKey(),
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: centsToDollars(item.unitPrice).toString(),
        })),
      );
    }
  }, [estimate]);

  const taxRateNum = parseFloat(taxRate) || 0;
  const taxDecimal = taxRateNum / 100;

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + Math.round(qty * dollarsToCents(price));
  }, 0);
  const taxAmount = Math.round(subtotal * taxDecimal);
  const total = subtotal + taxAmount;

  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      { key: nextKey(), description: '', quantity: '1', unitPrice: '' },
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

  const handleSave = async () => {
    const validItems = lineItems.filter(
      (item) => item.description.trim() && parseFloat(item.unitPrice) > 0,
    );
    if (validItems.length === 0) {
      setError('Add at least one line item');
      return;
    }
    setError('');

    try {
      await updateEstimate.mutateAsync({
        id: id!,
        updates: {
          issueDate: issueDate || undefined,
          expiresAt: expiresAt || undefined,
          notes: notes.trim() || undefined,
          taxRate: taxDecimal || undefined,
          lineItems: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: dollarsToCents(parseFloat(item.unitPrice)),
          })),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update estimate');
    }
  };

  if (!id || isLoading || !estimate) {
    return (
      <Screen padded={false}>
        <Header title="Edit Estimate" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Estimate not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  if (estimate.status !== 'DRAFT') {
    return (
      <Screen padded={false}>
        <Header title="Edit Estimate" showBack />
        <View style={styles.loading}>
          <Text style={{ color: colors.textMuted }}>Only draft estimates can be edited</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title={`Edit ${estimate.estimateNumber}`} showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dates */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <DatePickerField
                label="Issue Date"
                value={issueDate}
                onChange={setIssueDate}
              />
            </View>
            <View style={styles.halfInput}>
              <DatePickerField
                label="Expires"
                value={expiresAt}
                onChange={setExpiresAt}
              />
            </View>
          </View>

          {/* Tax Rate */}
          <Input
            label="Tax Rate (%)"
            value={taxRate}
            onChangeText={setTaxRate}
            keyboardType="decimal-pad"
            placeholder="0"
          />

          {/* Line Items */}
          <Text style={styles.sectionTitle}>Line Items</Text>
          {lineItems.map((item) => (
            <View key={item.key} style={styles.lineItemCard}>
              <View style={styles.lineItemTopRow}>
                <View style={styles.lineItemDescWrap}>
                  <Input
                    label="Description"
                    value={item.description}
                    onChangeText={(val) => handleUpdateItem(item.key, 'description', val)}
                    placeholder="Service or item"
                  />
                </View>
                {lineItems.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeItemBtn}
                    onPress={() => handleRemoveItem(item.key)}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Qty"
                    value={item.quantity}
                    onChangeText={(val) => handleUpdateItem(item.key, 'quantity', val)}
                    keyboardType="decimal-pad"
                    placeholder="1"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Unit Price"
                    value={item.unitPrice}
                    onChangeText={(val) => handleUpdateItem(item.key, 'unitPrice', val)}
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
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>

          {/* Totals */}
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatMoney(subtotal)}</Text>
            </View>
            {taxDecimal > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({taxRateNum}%)</Text>
                <Text style={styles.totalsValue}>{formatMoney(taxAmount)}</Text>
              </View>
            )}
            <View style={[styles.totalsRow, styles.totalsFinal]}>
              <Text style={styles.totalsFinalLabel}>Total</Text>
              <Text style={styles.totalsFinalValue}>{formatMoney(total)}</Text>
            </View>
          </View>

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Terms, scope of work..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={updateEstimate.isPending}
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
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    halfInput: { flex: 1 },
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
    totalsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    totalsLabel: { fontSize: 14, color: colors.textSecondary },
    totalsValue: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
    totalsFinal: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
    },
    totalsFinalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    totalsFinalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
