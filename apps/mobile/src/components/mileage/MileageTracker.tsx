import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../ui';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { formatMiles, formatMoney } from '../../lib/format';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface MileageTrackerProps {
  onTripComplete: (distanceMiles: number, deductionCents: number) => void;
}

export function MileageTracker({ onTripComplete }: MileageTrackerProps) {
  const {
    isTracking,
    distanceMiles,
    deductionCents,
    startTracking,
    stopTracking,
    startTime,
  } = useLocationTracking();

  const handleStop = () => {
    stopTracking();
    if (distanceMiles > 0) {
      onTripComplete(distanceMiles, deductionCents);
    }
  };

  const handleStart = async () => {
    try {
      await startTracking();
    } catch (err: any) {
      // Permission denied — user needs to grant location access
    }
  };

  if (isTracking) {
    return (
      <View style={styles.trackingContainer}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>TRACKING</Text>
        </View>

        <Text style={styles.distance}>{formatMiles(distanceMiles)}</Text>
        <Text style={styles.deduction}>{formatMoney(deductionCents)} deduction</Text>

        {startTime && (
          <Text style={styles.duration}>
            Started {new Date(startTime).toLocaleTimeString()}
          </Text>
        )}

        <Button
          title="Stop Trip"
          onPress={handleStop}
          variant="danger"
          size="lg"
          style={styles.stopButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.idleContainer}>
      <Button
        title="Start Trip"
        onPress={handleStart}
        variant="primary"
        size="lg"
        style={styles.startButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  idleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  startButton: {
    minWidth: 200,
    backgroundColor: colors.success,
  },
  trackingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    letterSpacing: 1,
  },
  distance: {
    ...typography.moneyLarge,
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  deduction: {
    fontSize: 18,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  duration: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  stopButton: {
    minWidth: 200,
  },
});
