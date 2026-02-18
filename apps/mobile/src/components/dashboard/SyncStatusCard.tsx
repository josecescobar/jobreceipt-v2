import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

export function SyncStatusCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isConnected, pendingActions } = useNetworkStatus();

  if (isConnected && pendingActions === 0) return null;

  const isOffline = !isConnected;

  return (
    <View style={[styles.card, isOffline ? styles.offlineCard : styles.syncingCard]}>
      <View style={styles.iconWrap}>
        {isOffline ? (
          <Ionicons name="cloud-offline-outline" size={20} color={colors.warning} />
        ) : (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, isOffline ? styles.offlineTitle : styles.syncingTitle]}>
          {isOffline ? 'Offline' : 'Syncing...'}
        </Text>
        <Text style={styles.subtitle}>
          {pendingActions} item{pendingActions !== 1 ? 's' : ''} queued
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
    },
    offlineCard: {
      backgroundColor: colors.warning + '15',
      borderColor: colors.warning + '40',
    },
    syncingCard: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary + '30',
    },
    iconWrap: {
      marginRight: spacing.md,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
    },
    offlineTitle: {
      color: colors.warning,
    },
    syncingTitle: {
      color: colors.primary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 1,
    },
  });
