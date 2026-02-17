import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineItemRow } from './LineItemRow';
import { Input } from '../ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { dollarsToCents } from '../../lib/format';
import type { ReceiptLineItem } from '@jobreceipt/shared';

interface LineItemListProps {
  items: ReceiptLineItem[];
  jobNames?: Record<string, string>;
  editing?: boolean;
  onUpdateItem?: (lineItemId: string, data: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => void;
  onDeleteItem?: (lineItemId: string) => void;
  onAddItem?: (data: { description: string; quantity: number; unitPrice: number; totalPrice: number }) => void;
}

export function LineItemList({ items, jobNames, editing, onUpdateItem, onDeleteItem, onAddItem }: LineItemListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newPrice, setNewPrice] = useState('');

  const handleAdd = () => {
    if (!onAddItem || !newDesc.trim()) return;
    const quantity = parseFloat(newQty) || 1;
    const unitPrice = dollarsToCents(parseFloat(newPrice) || 0);
    const totalPrice = Math.round(quantity * unitPrice);
    onAddItem({ description: newDesc.trim(), quantity, unitPrice, totalPrice });
    setNewDesc('');
    setNewQty('1');
    setNewPrice('');
    setShowAddForm(false);
  };

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Line Items</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No line items detected</Text>
        </View>
        {editing && onAddItem && (
          <AddItemSection
            showForm={showAddForm}
            onToggleForm={() => setShowAddForm(!showAddForm)}
            desc={newDesc}
            qty={newQty}
            price={newPrice}
            onChangeDesc={setNewDesc}
            onChangeQty={setNewQty}
            onChangePrice={setNewPrice}
            onAdd={handleAdd}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Line Items ({items.length})</Text>
      {items.map((item) => (
        <LineItemRow
          key={item.id}
          item={item}
          jobName={item.costCodeId && jobNames ? jobNames[item.costCodeId] : undefined}
          editing={editing}
          onSave={onUpdateItem ? (data) => onUpdateItem(item.id, data) : undefined}
          onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
        />
      ))}
      {editing && onAddItem && (
        <AddItemSection
          showForm={showAddForm}
          onToggleForm={() => setShowAddForm(!showAddForm)}
          desc={newDesc}
          qty={newQty}
          price={newPrice}
          onChangeDesc={setNewDesc}
          onChangeQty={setNewQty}
          onChangePrice={setNewPrice}
          onAdd={handleAdd}
        />
      )}
    </View>
  );
}

function AddItemSection({
  showForm,
  onToggleForm,
  desc,
  qty,
  price,
  onChangeDesc,
  onChangeQty,
  onChangePrice,
  onAdd,
}: {
  showForm: boolean;
  onToggleForm: () => void;
  desc: string;
  qty: string;
  price: string;
  onChangeDesc: (v: string) => void;
  onChangeQty: (v: string) => void;
  onChangePrice: (v: string) => void;
  onAdd: () => void;
}) {
  if (!showForm) {
    return (
      <TouchableOpacity style={styles.addButton} onPress={onToggleForm} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.addForm}>
      <Input
        label="Description"
        value={desc}
        onChangeText={onChangeDesc}
        placeholder="Item description"
      />
      <View style={styles.row}>
        <View style={styles.thirdField}>
          <Input
            label="Qty"
            value={qty}
            onChangeText={onChangeQty}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.twoThirdField}>
          <Input
            label="Unit Price"
            value={price}
            onChangeText={onChangePrice}
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
      </View>
      <View style={styles.addActions}>
        <TouchableOpacity onPress={onAdd} style={styles.confirmBtn}>
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <Text style={styles.confirmText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleForm} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  header: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  addForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thirdField: {
    flex: 1,
  },
  twoThirdField: {
    flex: 2,
  },
  addActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  confirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
