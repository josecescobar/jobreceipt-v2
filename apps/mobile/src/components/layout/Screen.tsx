import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfflineBanner } from '../ui/OfflineBanner';
import { useTheme, type ThemeColors, spacing } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  padded?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  padded = true,
  style,
  edges = ['top'],
}: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <OfflineBanner />
      <View style={[styles.container, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    padded: {
      paddingHorizontal: spacing.lg,
    },
  });
