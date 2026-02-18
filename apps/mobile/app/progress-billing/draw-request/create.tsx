import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Header } from '../../../src/components/layout';
import { Button, Input, DatePickerField } from '../../../src/components/ui';
import {
  useSOV,
  useCreateDrawRequest,
} from '../../../src/hooks/useProgressBilling';
import { dollarsToCents, formatMoney } from '../../../src/lib/format';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../../src/theme';

interface EntryState {
  sovItemId: string;
  workCompletedThisPeriod: string;
  materialsStored: string;
}

export default function CreateDrawRequestScreen() {
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createDrawRequest = useCreateDrawRequest();

  const { data: sov, isLoading } = useSOV(scheduleId!);

  const [periodTo, setPeriodTo] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<EntryState[]>([]);

  // Initialize entries when SOV loads
  useMemo(() => {
    if (sov?.items && entries.length === 0) {
      setEntries(
        sov.items.map((item) => ({
          sovItemId: item.id,
          workCompletedThisPeriod: '',
          materialsStored: '',
        })),
      );
    }
  }, [sov?.items]);

  // Compute previous work for each item from existing draw requests
  const previousWorkMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!sov?.drawRequests) return map;

    for (const dr of sov.drawRequests) {
      if (!dr.entries) continue;
      for (const entry of dr.entries) {
        const prev = map.get(entry.sovItemId) || 0;
        map.set(
          entry.sovItemId,
          prev + entry.workCompletedThisPeriod + entry.materialsStored,
        );
      }
    }
    return map;
  }, [sov?.drawRequests]);

  // Compute row calculations
  const computedRows = useMemo(() => {
    if (!sov?.items) return [];
    return sov.items.map((item, index) => {
      const entry = entries[index];
      if (!entry) {
        return {
          item,
          previous: 0,
          thisPeriod: 0,
          materials: 0,
          totalCompleted: 0,
          percentComplete: 0,
          balanceToFinish: item.scheduledValue,
        };
      }
      const previous = previousWorkMap.get(item.id) || 0;
      const thisPeriod = dollarsToCents(
        parseFloat(entry.workCompletedThisPeriod) || 0,
      );
      const materials = dollarsToCents(
        parseFloat(entry.materialsStored) || 0,
      );
      const totalCompleted = previous + thisPeriod + materials;
      const percentComplete =
        item.scheduledValue > 0
          ? Math.min((totalCompleted / item.scheduledValue) * 100, 100)
          : 0;
      const balanceToFinish = Math.max(item.scheduledValue - totalCompleted, 0);

      return {
        item,
        previous,
        thisPeriod,
        materials,
        totalCompleted,
        percentComplete,
        balanceToFinish,
      };
    });
  }, [sov?.items, entries, previousWorkMap]);

  // Compute totals
  const totals = useMemo(() => {
    const totalEarned = computedRows.reduce(
      (sum, r) => sum + r.totalCompleted,
      0,
    );
    const retainagePercent = sov?.retainagePercent ?? 10;
    const totalRetainage = Math.round(totalEarned * (retainagePercent / 100));

    // Previous billed = sum of all prior draw requests' currentPaymentDue
    const totalPreviouslyBilled = (sov?.drawRequests ?? []).reduce(
      (sum, dr) => sum + dr.currentPaymentDue,
      0,
    );

    const currentPaymentDue =
      totalEarned - totalRetainage - totalPreviouslyBilled;

    return {
      totalEarned,
      totalRetainage,
      totalPreviouslyBilled,
      currentPaymentDue,
    };
  }, [computedRows, sov]);

  const handleUpdateEntry = (
    index: number,
    field: keyof EntryState,
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const hasAnyWork = entries.some(
    (e) =>
      (parseFloat(e.workCompletedThisPeriod) || 0) > 0 ||
      (parseFloat(e.materialsStored) || 0) > 0,
  );

  const handleSubmit = async () => {
    if (!scheduleId) {
      setError('Missing schedule ID');
      return;
    }

    if (!hasAnyWork) {
      setError('Enter work completed for at least one item');
      return;
    }

    setError('');

    const validEntries = entries
      .filter(
        (e) =>
          (parseFloat(e.workCompletedThisPeriod) || 0) > 0 ||
          (parseFloat(e.materialsStored) || 0) > 0,
      )
      .map((e) => ({
        sovItemId: e.sovItemId,
        workCompletedThisPeriod: dollarsToCents(
          parseFloat(e.workCompletedThisPeriod) || 0,
        ),
        materialsStored: dollarsToCents(
          parseFloat(e.materialsStored) || 0,
        ),
      }));

    try {
      const result = await createDrawRequest.mutateAsync({
        scheduleId: scheduleId!,
        periodTo,
        notes: notes.trim() || undefined,
        entries: validEntries,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/progress-billing/draw-request/${result.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create draw request',
      );
    }
  };

  if (isLoading || !sov) {
    return (
      <Screen padded={false}>
        <Header title="New Draw Request" showBack />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="New Draw Request" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Period Date */}
          <DatePickerField
            label="Period To *"
            value={periodTo}
            onChange={setPeriodTo}
          />

          {/* SOV Items with entry inputs */}
          <Text style={styles.sectionTitle}>Work Completed</Text>

          {computedRows.map((row, index) => (
            <View key={row.item.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.itemNumberBadge}>
                  <Text style={styles.itemNumberText}>
                    #{row.item.itemNumber}
                  </Text>
                </View>
                <Text style={styles.entryDescription} numberOfLines={1}>
                  {row.item.description}
                </Text>
              </View>

              <View style={styles.entryInfoRow}>
                <View style={styles.entryInfoItem}>
                  <Text style={styles.entryInfoLabel}>Scheduled</Text>
                  <Text style={styles.entryInfoValue}>
                    {formatMoney(row.item.scheduledValue)}
                  </Text>
                </View>
                <View style={styles.entryInfoItem}>
                  <Text style={styles.entryInfoLabel}>Previous</Text>
                  <Text style={styles.entryInfoValue}>
                    {formatMoney(row.previous)}
                  </Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Input
                    label="This Period ($)"
                    value={entries[index]?.workCompletedThisPeriod ?? ''}
                    onChangeText={(val) =>
                      handleUpdateEntry(
                        index,
                        'workCompletedThisPeriod',
                        val,
                      )
                    }
                    keyboardType="decimal-pad"
                    prefix="$"
                    placeholder="0.00"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Input
                    label="Materials ($)"
                    value={entries[index]?.materialsStored ?? ''}
                    onChangeText={(val) =>
                      handleUpdateEntry(index, 'materialsStored', val)
                    }
                    keyboardType="decimal-pad"
                    prefix="$"
                    placeholder="0.00"
                  />
                </View>
              </View>

              {/* Auto-calculated fields */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  Total: {formatMoney(row.totalCompleted)}
                </Text>
                <Text style={styles.calcLabel}>
                  {row.percentComplete.toFixed(1)}%
                </Text>
                <Text style={styles.calcLabel}>
                  Bal: {formatMoney(row.balanceToFinish)}
                </Text>
              </View>
            </View>
          ))}

          {/* Notes */}
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={3}
          />

          {/* Totals Card */}
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total Earned</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(totals.totalEarned)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Retainage ({sov.retainagePercent}%)
              </Text>
              <Text style={[styles.totalsValue, { color: colors.warning }]}>
                -{formatMoney(totals.totalRetainage)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Previously Billed</Text>
              <Text style={styles.totalsValue}>
                -{formatMoney(totals.totalPreviouslyBilled)}
              </Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsFinal]}>
              <Text style={styles.totalsFinalLabel}>Current Payment Due</Text>
              <Text style={styles.totalsFinalValue}>
                {formatMoney(totals.currentPaymentDue)}
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Draw Request"
            onPress={handleSubmit}
            loading={createDrawRequest.isPending}
            disabled={!hasAnyWork}
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: { fontSize: 14, color: colors.textMuted },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    entryCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    itemNumberBadge: {
      backgroundColor: colors.primary + '15',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginRight: spacing.sm,
    },
    itemNumberText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    entryDescription: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    entryInfoRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginBottom: spacing.sm,
    },
    entryInfoItem: {},
    entryInfoLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    entryInfoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    inputHalf: { flex: 1 },
    calcRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    calcLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
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
    totalsValue: {
      fontSize: 14,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    totalsFinal: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
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
