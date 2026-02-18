import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../src/components/layout';
import { Button, Input, DatePickerField } from '../../src/components/ui';
import { useCreateEquipment } from '../../src/hooks/useEquipment';
import { dollarsToCents } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing } from '../../src/theme';

export default function CreateEquipmentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createEquipment = useCreateEquipment();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCostStr, setPurchaseCostStr] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');

    const purchaseCost = purchaseCostStr
      ? dollarsToCents(parseFloat(purchaseCostStr))
      : undefined;

    try {
      await createEquipment.mutateAsync({
        name: name.trim(),
        type: type.trim() || undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        purchaseCost: purchaseCost && !isNaN(purchaseCost) ? purchaseCost : undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create equipment');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Add Equipment" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. DeWalt Circular Saw"
          />

          <Input
            label="Type"
            value={type}
            onChangeText={setType}
            placeholder="e.g. Power Tool, Hand Tool, Heavy Equipment"
          />

          <Input
            label="Make"
            value={make}
            onChangeText={setMake}
            placeholder="e.g. DeWalt, Caterpillar"
          />

          <Input
            label="Model"
            value={model}
            onChangeText={setModel}
            placeholder="e.g. DCS570B"
          />

          <Input
            label="Serial Number"
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="e.g. SN-12345-ABC"
          />

          <DatePickerField
            label="Purchase Date"
            value={purchaseDate}
            onChange={setPurchaseDate}
            placeholder="Select purchase date (optional)"
          />

          <Input
            label="Purchase Cost ($)"
            value={purchaseCostStr}
            onChangeText={setPurchaseCostStr}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save Equipment"
            onPress={handleSubmit}
            loading={createEquipment.isPending}
            disabled={!canSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });
