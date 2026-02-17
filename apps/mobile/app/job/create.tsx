import React, { useState } from 'react';
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
import { useCreateJob } from '../../src/hooks/useJobs';
import { dollarsToCents } from '../../src/lib/format';
import { colors, spacing, borderRadius, typography } from '../../src/theme';

export default function CreateJobScreen() {
  const router = useRouter();
  const createJob = useCreateJob();

  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [materialsBudget, setMaterialsBudget] = useState('');
  const [laborBudget, setLaborBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Job name is required');
      return;
    }
    setError('');

    try {
      await createJob.mutateAsync({
        name: name.trim(),
        customerName: customerName.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        budgetTotal: totalBudget ? dollarsToCents(parseFloat(totalBudget)) : undefined,
        budgetMaterials: materialsBudget
          ? dollarsToCents(parseFloat(materialsBudget))
          : undefined,
        budgetLabor: laborBudget
          ? dollarsToCents(parseFloat(laborBudget))
          : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Job" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Job Details</Text>

          <Input
            label="Job Name *"
            value={name}
            onChangeText={setName}
            placeholder="Kitchen Remodel - Smith"
            error={error && !name.trim() ? error : undefined}
          />

          <Text style={styles.sectionTitle}>Customer</Text>

          <Input
            label="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="John Smith"
          />
          <Input
            label="Customer Address"
            value={customerAddress}
            onChangeText={setCustomerAddress}
            placeholder="123 Main St, City, ST"
            multiline
          />

          <Text style={styles.sectionTitle}>Budget</Text>

          <Input
            label="Total Budget"
            value={totalBudget}
            onChangeText={setTotalBudget}
            keyboardType="decimal-pad"
            prefix="$"
            placeholder="0.00"
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Materials"
                value={materialsBudget}
                onChangeText={setMaterialsBudget}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Labor"
                value={laborBudget}
                onChangeText={setLaborBudget}
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <DatePickerField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
              />
            </View>
            <View style={styles.halfInput}>
              <DatePickerField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Notes</Text>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional details about the job..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />

          {error && name.trim() ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Job"
            onPress={handleSubmit}
            loading={createJob.isPending}
            disabled={!name.trim()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
