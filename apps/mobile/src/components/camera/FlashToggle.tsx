import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeColors, MIN_TOUCH_TARGET } from '../../theme';

interface FlashToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function FlashToggle({ enabled, onToggle }: FlashToggleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = () => {
    Haptics.selectionAsync();
    onToggle();
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={enabled ? 'flash' : 'flash-off'}
        size={22}
        color={colors.white}
      />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
