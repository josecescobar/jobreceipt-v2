import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input } from '../../../src/components/ui';
import { useJob, useUpdateJob, useDeleteJob } from '../../../src/hooks/useJobs';
import { dollarsToCents, centsToDollars } from '../../../src/lib/format';
import { colors, spacing } from '../../../src/theme';

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: job, isLoading } = useJob(id ?? '');
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

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

  useEffect(() => {
    if (job) {
      setName(job.name || '');
      setCustomerName(job.customerName || '');
      setCustomerAddress(job.customerAddress || '');
      setTotalBudget(job.budgetTotal ? centsToDollars(job.budgetTotal).toString() : '');
      setMaterialsBudget(job.budgetMaterials ? centsToDollars(job.budgetMaterials).toString() : '');
      setLaborBudget(job.budgetLabor ? centsToDollars(job.budgetLabor).toString() : '');
      setStartDate(job.startDate ? job.startDate.toString().split('T')[0] : '');
      setEndDate(job.endDate ? job.endDate.toString().split('T')[0] : '');
      setNotes(job.notes || '');
    }
  }, [job]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Job name is required');
      return;
    }
    setError('');

    try {
      await updateJob.mutateAsync({
        id: id!,
        updates: {
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
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update job');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Job', 'Are you sure? This will archive the job.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteJob.mutateAsync(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete job');
          }
        },
      },
    ]);
  };

  if (!id || isLoading || !job) {
    return (
      <Screen padded={false}>
        <Header title="Edit Job" showBack />
        <View style={styles.loading}>
          {!id ? (
            <Text style={{ color: colors.textMuted }}>Job not found</Text>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Edit Job" showBack />
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
              <Input
                label="Start Date"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="End Date"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
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
            title="Save Changes"
            onPress={handleSave}
            loading={updateJob.isPending}
            disabled={!name.trim()}
          />

          <Button
            title="Delete Job"
            onPress={handleDelete}
            variant="danger"
            loading={deleteJob.isPending}
            style={styles.deleteButton}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteButton: {
    marginTop: spacing.md,
  },
});
