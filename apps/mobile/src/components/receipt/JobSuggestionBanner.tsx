import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { colors, spacing, borderRadius } from '../../theme';

interface JobSuggestionBannerProps {
  jobName: string;
  confidence?: number;
  onAssign: () => void;
  onDismiss: () => void;
}

export function JobSuggestionBanner({
  jobName,
  confidence,
  onAssign,
  onDismiss,
}: JobSuggestionBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={18} color={colors.primary} />
        <Text style={styles.label}>AI Suggestion</Text>
      </View>
      <Text style={styles.jobName}>{jobName}</Text>
      {confidence != null && (
        <Text style={styles.confidence}>
          {Math.round(confidence * 100)}% confidence
        </Text>
      )}
      <View style={styles.actions}>
        <Button
          title="Assign"
          onPress={onAssign}
          variant="primary"
          size="sm"
          style={styles.assignButton}
        />
        <Button
          title="Dismiss"
          onPress={onDismiss}
          variant="ghost"
          size="sm"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  confidence: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignButton: {
    marginRight: spacing.sm,
  },
});
