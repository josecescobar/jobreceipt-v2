import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function CaptureButton({ onPress, disabled }: CaptureButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.outer, disabled && styles.disabled]}
    >
      <View style={styles.inner} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
});
