import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme, type ThemeColors, borderRadius } from '../../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadiusSize?: number;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  style,
  borderRadiusSize = borderRadius.sm,
}: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius: borderRadiusSize, opacity },
        style,
      ]}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceLight,
  },
});
