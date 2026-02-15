import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/components/layout';
import { Button, EmptyState } from '../../src/components/ui';
import {
  MileageSummary,
  MileageTracker,
  MileageTripCard,
  ManualMileageForm,
} from '../../src/components/mileage';
import { useExpenses, useCreateExpense } from '../../src/hooks/useExpenses';
import { useJobs } from '../../src/hooks/useJobs';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { spacing } from '../../src/theme';

export default function MileageScreen() {
  const [showManual, setShowManual] = useState(false);
  const createExpense = useCreateExpense();

  // Fetch mileage expenses (those with mileage > 0)
  const { data: expensesData, refetch } = useExpenses({ category: 'OVERHEAD' });
  const mileageExpenses = useMemo(() => {
    const all = expensesData?.pages?.flatMap((p) => p.data) ?? [];
    return all.filter((e) => e.mileage && e.mileage > 0);
  }, [expensesData]);

  const { data: jobsData } = useJobs({ limit: 100 });
  const jobNameMap = useMemo(() => {
    const jobs = jobsData?.pages?.flatMap((p) => p.data) ?? [];
    return Object.fromEntries(jobs.map((j) => [j.id, j.name]));
  }, [jobsData]);

  // Monthly summary
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthTrips = mileageExpenses.filter(
    (e) => e.date && e.date >= monthStart,
  );
  const totalMiles = thisMonthTrips.reduce((sum, e) => sum + (e.mileage || 0), 0);
  const totalDeduction = thisMonthTrips.reduce((sum, e) => sum + e.amount, 0);

  const handleTripComplete = async (distanceMiles: number, deductionCents: number) => {
    try {
      await createExpense.mutateAsync({
        amount: deductionCents,
        description: `GPS tracked trip (${distanceMiles.toFixed(1)} mi)`,
        category: 'OVERHEAD',
        mileage: distanceMiles,
        date: new Date().toISOString().split('T')[0],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Screen>
      <FlatList
        data={mileageExpenses}
        renderItem={({ item }) => (
          <MileageTripCard
            date={item.date || ''}
            miles={item.mileage || 0}
            deductionCents={item.amount}
            jobName={item.jobId ? jobNameMap[item.jobId] : undefined}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <MileageSummary
              totalMiles={totalMiles}
              totalDeductionCents={totalDeduction}
              period={monthName}
            />
            <MileageTracker onTripComplete={handleTripComplete} />
            <Button
              title="Manual Entry"
              onPress={() => setShowManual(true)}
              variant="secondary"
              style={styles.manualButton}
            />
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Trips Yet"
            message="Start a GPS trip or add one manually."
          />
        }
      />

      <ManualMileageForm
        visible={showManual}
        onClose={() => {
          setShowManual(false);
          refetch();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxxl,
  },
  manualButton: {
    marginVertical: spacing.md,
  },
});
