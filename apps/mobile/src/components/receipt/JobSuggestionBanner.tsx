import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, MIN_TOUCH_TARGET } from '../../theme';

interface JobSuggestionBannerProps {
  jobName: string;
  confidence?: string;
  onDismiss?: () => void;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

export function JobSuggestionBanner({
  jobName,
  confidence,
  onDismiss,
}: JobSuggestionBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.label}>AI Suggestion</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.jobName}>{jobName}</Text>
      {confidence && CONFIDENCE_LABELS[confidence] && (
        <Text style={styles.confidence}>
          {CONFIDENCE_LABELS[confidence]}
        </Text>
      )}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});
