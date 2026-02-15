import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSyncStatus, onSyncStatusChange, syncNow } from '../../db/sync';
import { colors, spacing } from '../../theme';

export function SyncStatusIndicator() {
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => {
    return onSyncStatusChange(setStatus);
  }, []);

  if (status === 'idle') return null;

  return (
    <TouchableOpacity
      style={[styles.container, status === 'error' && styles.error]}
      onPress={syncNow}
      activeOpacity={0.7}
    >
      <Ionicons
        name={status === 'syncing' ? 'sync' : 'cloud-offline'}
        size={14}
        color={status === 'error' ? colors.error : colors.primary}
      />
      <Text style={[styles.text, status === 'error' && styles.errorText]}>
        {status === 'syncing' ? 'Syncing...' : 'Sync failed — tap to retry'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  text: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
});
