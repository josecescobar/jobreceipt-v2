import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { colors, spacing } from '../../theme';

const BANNER_HEIGHT = 36;

export function OfflineBanner() {
  const { isConnected, pendingActions } = useNetworkStatus();
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(height, {
      toValue: isConnected ? 0 : BANNER_HEIGHT,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isConnected, height]);

  return (
    <Animated.View style={[styles.banner, { height }]}>
      <Ionicons name="cloud-offline-outline" size={14} color={colors.black} />
      <Text style={styles.text} numberOfLines={1}>
        No internet connection
        {pendingActions > 0 ? ` · ${pendingActions} pending` : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },
});
