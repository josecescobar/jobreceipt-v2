import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, PanResponder } from 'react-native';
import SvgOrig, { Path as PathOrig } from 'react-native-svg';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

// Workaround for react-native-svg JSX type incompatibility
const Svg = SvgOrig as unknown as React.ComponentType<any>;
const Path = PathOrig as unknown as React.ComponentType<any>;

interface SignaturePadProps {
  onSave: (pathData: string) => void;
  onClear: () => void;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSave,
  onClear,
  width = 300,
  height = 200,
}: SignaturePadProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>('');
  const [currentDisplay, setCurrentDisplay] = useState<string>('');

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentPath.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          setCurrentDisplay(currentPath.current);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentPath.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          setCurrentDisplay(currentPath.current);
        },
        onPanResponderRelease: () => {
          if (currentPath.current) {
            setPaths((prev) => [...prev, currentPath.current]);
            currentPath.current = '';
            setCurrentDisplay('');
          }
        },
      }),
    [],
  );

  const handleClear = useCallback(() => {
    setPaths([]);
    currentPath.current = '';
    setCurrentDisplay('');
    onClear();
  }, [onClear]);

  const handleSave = useCallback(() => {
    const allPaths = paths.join(' ');
    if (allPaths.length > 0) {
      onSave(allPaths);
    }
  }, [paths, onSave]);

  const hasDrawing = paths.length > 0 || currentDisplay.length > 0;

  return (
    <View style={styles.container}>
      <View
        style={[styles.canvas, { width, height }]}
        {...panResponder.panHandlers}
      >
        <Svg width={width} height={height}>
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke="#000000"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentDisplay ? (
            <Path
              d={currentDisplay}
              stroke="#000000"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
        {!hasDrawing && (
          <View style={styles.placeholder} pointerEvents="none">
            <Text style={styles.placeholderText}>Sign here</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !hasDrawing && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasDrawing}
        >
          <Text
            style={[
              styles.saveText,
              !hasDrawing && styles.saveTextDisabled,
            ]}
          >
            Accept Signature
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    canvas: {
      backgroundColor: '#FFFFFF',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    placeholder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: '#C0C0C0',
      fontStyle: 'italic',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    clearBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    clearText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    saveBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
    saveTextDisabled: {
      color: colors.white,
    },
  });
