import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button, Input } from '../ui';
import { useCreateJob } from '../../hooks/useJobs';
import { dollarsToCents } from '../../lib/format';
import { spacing } from '../../theme';

export function QuickAddJobForm() {
  const router = useRouter();
  const createJob = useCreateJob();
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [materialsBudget, setMaterialsBudget] = useState('');
  const [laborBudget, setLaborBudget] = useState('');
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
        totalBudget: totalBudget ? dollarsToCents(parseFloat(totalBudget)) : undefined,
        materialsBudget: materialsBudget
          ? dollarsToCents(parseFloat(materialsBudget))
          : undefined,
        laborBudget: laborBudget
          ? dollarsToCents(parseFloat(laborBudget))
          : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Job Name *"
          value={name}
          onChangeText={setName}
          placeholder="Kitchen Remodel - Smith"
          error={error && !name.trim() ? error : undefined}
        />
        <Input
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="John Smith"
        />
        <Input
          label="Total Budget"
          value={totalBudget}
          onChangeText={setTotalBudget}
          keyboardType="decimal-pad"
          prefix="$"
          placeholder="0.00"
        />
        <Input
          label="Materials Budget"
          value={materialsBudget}
          onChangeText={setMaterialsBudget}
          keyboardType="decimal-pad"
          prefix="$"
          placeholder="0.00"
        />
        <Input
          label="Labor Budget"
          value={laborBudget}
          onChangeText={setLaborBudget}
          keyboardType="decimal-pad"
          prefix="$"
          placeholder="0.00"
        />

        <Button
          title="Create Job"
          onPress={handleSubmit}
          loading={createJob.isPending}
          disabled={!name.trim()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
  },
});
