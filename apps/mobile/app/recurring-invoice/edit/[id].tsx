import React, { useState, useMemo, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import { useRecurringInvoice, useUpdateRecurringInvoice } from '../../../src/hooks/useRecurringInvoices';
import { dollarsToCents, centsToDollars, formatMoney } from '../../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../../src/theme';

const FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
] as const;

interface LineItem {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

let lineItemKey = 0;
function nextKey() {
  return `eli-${++lineItemKey}`;
}

export default function EditRecurringInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: existing, isLoading } = useRecurringInvoice(id ?? '');
  const updateMutation = useUpdateRecurringInvoice();

  const [frequency, setFrequency] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setFrequency(existing.frequency);
      setStartDate(existing.startDate.split('T')[0]);
      setEndDate(existing.endDate ? existing.endDate.split('T')[0] : '');
      setNotes(existing.notes || '');
      setTaxRate(existing.taxRate > 0 ? (existing.taxRate * 100).toString() : '');
      setLineItems(
        (existing.lineItems ?? []).map((li) => ({
          key: nextKey(),
          description: li.description,
          quantity: li.quantity.toString(),
          unitPrice: centsToDollars(li.unitPrice).toString(),
        })),
      );
      setLoaded(true);
    }
  }, [existing, loaded]);

  if (isLoading || !existing) {
    return (
      <Screen padded={false}>
        <Header title="Edit Recurring Invoice" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

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

  const handleSubmit = async () => {
    const validItems = lineItems.filter(
      (item) => item.description.trim() && parseFloat(item.unitPrice) > 0,
    );
    if (validItems.length === 0) {
      setError('Add at least one line item');
      return;
    }
    setError('');

    try {
      await updateMutation.mutateAsync({
        id: id!,
        updates: {
          frequency: frequency as any,
          startDate,
          endDate: endDate || undefined,
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
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Edit Recurring Invoice" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job (read-only) */}
          {existing.job && (
            <>
              <Text style={styles.label}>Job</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{existing.job.name}</Text>
              </View>
            </>
          )}

          {/* Frequency */}
          <Text style={styles.label}>Frequency</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, frequency === f.value && styles.chipActive]}
                onPress={() => setFrequency(f.value)}
              >
                <Text
                  style={[styles.chipText, frequency === f.value && styles.chipTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dates */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} />
            </View>
            <View style={styles.halfInput}>
              <DatePickerField label="End Date" value={endDate} onChange={setEndDate} />
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
              <Text style={styles.totalsFinalLabel}>Total per Invoice</Text>
              <Text style={styles.totalsFinalValue}>{formatMoney(total)}</Text>
            </View>
          </View>

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional details..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={updateMutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    readOnlyField: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readOnlyText: { fontSize: 15, color: colors.text, fontWeight: '500' },
    chipScroll: { marginBottom: spacing.lg },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 14, color: colors.textSecondary },
    chipTextActive: { color: colors.white },
    row: { flexDirection: 'row', gap: spacing.md },
    halfInput: { flex: 1 },
    lineItemsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      marginTop: spacing.md,
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
