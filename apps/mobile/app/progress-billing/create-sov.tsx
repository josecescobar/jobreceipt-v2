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
import { useCreateSOV } from '../../src/hooks/useProgressBilling';
import { useJobs } from '../../src/hooks/useJobs';
import { useSOVList } from '../../src/hooks/useProgressBilling';
import { dollarsToCents, formatMoney } from '../../src/lib/format';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../src/theme';

interface SOVLineItem {
  key: string;
  itemNumber: string;
  description: string;
  scheduledValue: string;
}

let lineItemKey = 0;
function nextKey() {
  return `sov-item-${++lineItemKey}`;
}

function padItemNumber(n: number): string {
  return String(n).padStart(3, '0');
}

export default function CreateSOVScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createSOV = useCreateSOV();

  const { data: jobsData } = useJobs({ status: 'ACTIVE', limit: 100 });
  const jobs = useMemo(
    () => jobsData?.pages?.flatMap((p) => p.data) ?? [],
    [jobsData],
  );

  // Get existing SOVs to exclude jobs that already have one
  const { data: sovListData } = useSOVList({ limit: 200 });
  const existingJobIds = useMemo(() => {
    const sovs = sovListData?.data ?? [];
    return new Set(sovs.map((s: any) => s.job?.id).filter(Boolean));
  }, [sovListData]);

  const availableJobs = useMemo(
    () => jobs.filter((j) => !existingJobIds.has(j.id)),
    [jobs, existingJobIds],
  );

  const [jobId, setJobId] = useState('');
  const [retainagePercent, setRetainagePercent] = useState('10');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<SOVLineItem[]>([
    {
      key: nextKey(),
      itemNumber: '001',
      description: '',
      scheduledValue: '',
    },
  ]);
  const [error, setError] = useState('');

  const runningTotal = lineItems.reduce((sum, item) => {
    const val = parseFloat(item.scheduledValue) || 0;
    return sum + dollarsToCents(val);
  }, 0);

  const canSubmit =
    jobId.length > 0 &&
    lineItems.some(
      (item) =>
        item.description.trim().length > 0 && parseFloat(item.scheduledValue) > 0,
    );

  const handleAddItem = () => {
    const nextNum = lineItems.length + 1;
    setLineItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        itemNumber: padItemNumber(nextNum),
        description: '',
        scheduledValue: '',
      },
    ]);
  };

  const handleRemoveItem = (key: string) => {
    setLineItems((prev) => {
      const filtered = prev.filter((item) => item.key !== key);
      // Re-number items
      return filtered.map((item, idx) => ({
        ...item,
        itemNumber: padItemNumber(idx + 1),
      }));
    });
  };

  const handleUpdateItem = (
    key: string,
    field: keyof SOVLineItem,
    value: string,
  ) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!jobId) {
      setError('Please select a job');
      return;
    }

    const validItems = lineItems.filter(
      (item) =>
        item.description.trim().length > 0 && parseFloat(item.scheduledValue) > 0,
    );

    if (validItems.length === 0) {
      setError('Add at least one line item with a description and value');
      return;
    }

    setError('');

    try {
      const result = await createSOV.mutateAsync({
        jobId,
        retainagePercent: parseFloat(retainagePercent) || 10,
        notes: notes.trim() || undefined,
        items: validItems.map((item) => ({
          itemNumber: item.itemNumber,
          description: item.description.trim(),
          scheduledValue: dollarsToCents(parseFloat(item.scheduledValue)),
        })),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/progress-billing/${result.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create Schedule of Values',
      );
    }
  };

  return (
    <Screen padded={false}>
      <Header title="New Schedule of Values" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job Picker */}
          <Text style={styles.label}>Job *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {availableJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={[styles.chip, jobId === job.id && styles.chipActive]}
                onPress={() => setJobId(jobId === job.id ? '' : job.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    jobId === job.id && styles.chipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {job.name}
                </Text>
              </TouchableOpacity>
            ))}
            {availableJobs.length === 0 && (
              <Text style={styles.emptyChipText}>
                No available jobs (all active jobs already have an SOV)
              </Text>
            )}
          </ScrollView>

          {/* Retainage */}
          <Input
            label="Retainage %"
            value={retainagePercent}
            onChangeText={setRetainagePercent}
            keyboardType="decimal-pad"
            placeholder="10"
          />

          {/* Line Items */}
          <Text style={styles.sectionTitle}>Line Items</Text>

          {lineItems.map((item) => (
            <View key={item.key} style={styles.lineItemCard}>
              <View style={styles.lineItemTopRow}>
                <View style={styles.itemNumberWrap}>
                  <Text style={styles.itemNumberLabel}>#{item.itemNumber}</Text>
                </View>
                <View style={styles.lineItemDescWrap}>
                  <Input
                    label="Description"
                    value={item.description}
                    onChangeText={(val) =>
                      handleUpdateItem(item.key, 'description', val)
                    }
                    placeholder="e.g. Concrete Foundation"
                  />
                </View>
                {lineItems.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeItemBtn}
                    onPress={() => handleRemoveItem(item.key)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Input
                label="Scheduled Value ($)"
                value={item.scheduledValue}
                onChangeText={(val) =>
                  handleUpdateItem(item.key, 'scheduledValue', val)
                }
                keyboardType="decimal-pad"
                prefix="$"
                placeholder="0.00"
              />
            </View>
          ))}

          <TouchableOpacity onPress={handleAddItem} style={styles.addItemBtn}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.addItemText}>Add Line Item</Text>
          </TouchableOpacity>

          {/* Running Total */}
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsFinalLabel}>Total Scheduled Value</Text>
              <Text style={styles.totalsFinalValue}>
                {formatMoney(runningTotal)}
              </Text>
            </View>
          </View>

          {/* Notes */}
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
            title="Create Schedule of Values"
            onPress={handleSubmit}
            loading={createSOV.isPending}
            disabled={!canSubmit}
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
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
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
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: { fontSize: 14, color: colors.textSecondary },
    chipTextActive: { color: colors.white },
    emptyChipText: {
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: 'italic',
      paddingVertical: spacing.sm,
    },
    lineItemCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lineItemTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    itemNumberWrap: {
      backgroundColor: colors.primary + '15',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginRight: spacing.sm,
      marginTop: spacing.lg,
    },
    itemNumberLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
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
      alignItems: 'center',
    },
    totalsFinalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
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
