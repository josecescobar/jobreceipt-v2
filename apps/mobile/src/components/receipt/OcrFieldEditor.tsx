import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, DatePickerField } from '../ui';
import { spacing } from '../../theme';

interface OcrFieldEditorProps {
  merchant: string;
  merchantAddress: string;
  date: string;
  subtotal: string;
  tax: string;
  total: string;
  onChangeMerchant: (v: string) => void;
  onChangeMerchantAddress: (v: string) => void;
  onChangeDate: (v: string) => void;
  onChangeSubtotal: (v: string) => void;
  onChangeTax: (v: string) => void;
  onChangeTotal: (v: string) => void;
}

export function OcrFieldEditor({
  merchant,
  merchantAddress,
  date,
  subtotal,
  tax,
  total,
  onChangeMerchant,
  onChangeMerchantAddress,
  onChangeDate,
  onChangeSubtotal,
  onChangeTax,
  onChangeTotal,
}: OcrFieldEditorProps) {
  const totalManuallyEdited = useRef(false);

  // Auto-calculate total when subtotal or tax changes (unless user manually edited total)
  useEffect(() => {
    if (totalManuallyEdited.current) return;
    const sub = parseFloat(subtotal) || 0;
    const t = parseFloat(tax) || 0;
    if (sub > 0 || t > 0) {
      onChangeTotal((sub + t).toFixed(2));
    }
  }, [subtotal, tax]);

  const handleTotalChange = (v: string) => {
    totalManuallyEdited.current = true;
    onChangeTotal(v);
  };

  return (
    <View style={styles.container}>
      <Input
        label="Merchant"
        value={merchant}
        onChangeText={onChangeMerchant}
        placeholder="Store name"
      />
      <Input
        label="Address"
        value={merchantAddress}
        onChangeText={onChangeMerchantAddress}
        placeholder="Store address"
      />
      <DatePickerField
        label="Date"
        value={date}
        onChange={onChangeDate}
      />
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Input
            label="Subtotal"
            value={subtotal}
            onChangeText={onChangeSubtotal}
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
        <View style={styles.halfField}>
          <Input
            label="Tax"
            value={tax}
            onChangeText={onChangeTax}
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
      </View>
      <Input
        label="Total"
        value={total}
        onChangeText={handleTotalChange}
        keyboardType="decimal-pad"
        prefix="$"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
});
