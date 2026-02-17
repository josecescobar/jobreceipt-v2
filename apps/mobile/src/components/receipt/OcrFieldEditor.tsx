import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, DatePickerField } from '../ui';
import { spacing } from '../../theme';

interface OcrFieldEditorProps {
  merchant: string;
  date: string;
  subtotal: string;
  tax: string;
  total: string;
  onChangeMerchant: (v: string) => void;
  onChangeDate: (v: string) => void;
  onChangeSubtotal: (v: string) => void;
  onChangeTax: (v: string) => void;
  onChangeTotal: (v: string) => void;
}

export function OcrFieldEditor({
  merchant,
  date,
  subtotal,
  tax,
  total,
  onChangeMerchant,
  onChangeDate,
  onChangeSubtotal,
  onChangeTax,
  onChangeTotal,
}: OcrFieldEditorProps) {
  return (
    <View style={styles.container}>
      <Input
        label="Merchant"
        value={merchant}
        onChangeText={onChangeMerchant}
        placeholder="Store name"
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
        onChangeText={onChangeTotal}
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
