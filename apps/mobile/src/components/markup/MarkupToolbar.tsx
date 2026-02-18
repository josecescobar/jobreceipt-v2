import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, type ThemeColors, spacing, borderRadius } from '../../theme';

export type MarkupTool = 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand';

interface MarkupToolbarProps {
  tool: MarkupTool;
  onToolChange: (tool: MarkupTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const TOOLS: { key: MarkupTool; label: string }[] = [
  { key: 'arrow', label: 'Arrow' },
  { key: 'circle', label: 'Circle' },
  { key: 'rectangle', label: 'Rect' },
  { key: 'text', label: 'Text' },
  { key: 'freehand', label: 'Draw' },
];

const COLOR_PRESETS = [
  '#FF3B30',
  '#007AFF',
  '#34C759',
  '#FFCC00',
  '#FFFFFF',
  '#000000',
];

const STROKE_WIDTHS = [
  { value: 2, size: 6 },
  { value: 4, size: 10 },
  { value: 6, size: 14 },
];

export function MarkupToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onCancel,
  saving,
}: MarkupToolbarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleToolPress = (t: MarkupTool) => {
    Haptics.selectionAsync();
    onToolChange(t);
  };

  const handleColorPress = (c: string) => {
    Haptics.selectionAsync();
    onColorChange(c);
  };

  const handleStrokePress = (w: number) => {
    Haptics.selectionAsync();
    onStrokeWidthChange(w);
  };

  return (
    <View style={styles.container}>
      {/* Tools row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsRow}
      >
        {TOOLS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.toolChip, tool === t.key && styles.toolChipActive]}
            onPress={() => handleToolPress(t.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toolChipText,
                tool === t.key && styles.toolChipTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Color + stroke row */}
      <View style={styles.optionsRow}>
        <View style={styles.colorsContainer}>
          {COLOR_PRESETS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => handleColorPress(c)}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                c === '#FFFFFF' && styles.colorSwatchWhite,
                color === c && styles.colorSwatchSelected,
              ]}
              activeOpacity={0.7}
            />
          ))}
        </View>

        <View style={styles.strokeContainer}>
          {STROKE_WIDTHS.map((sw) => (
            <TouchableOpacity
              key={sw.value}
              onPress={() => handleStrokePress(sw.value)}
              style={[
                styles.strokeBtn,
                strokeWidth === sw.value && styles.strokeBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.strokeDot,
                  {
                    width: sw.size,
                    height: sw.size,
                    borderRadius: sw.size / 2,
                    backgroundColor:
                      strokeWidth === sw.value ? colors.white : colors.text,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Actions row */}
      <View style={styles.actionsRow}>
        <View style={styles.undoRedoContainer}>
          <TouchableOpacity
            onPress={onUndo}
            disabled={!canUndo}
            style={[styles.iconBtn, !canUndo && styles.iconBtnDisabled]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-undo"
              size={22}
              color={canUndo ? colors.text : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRedo}
            disabled={!canRedo}
            style={[styles.iconBtn, !canRedo && styles.iconBtnDisabled]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-redo"
              size={22}
              color={canRedo ? colors.text : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.saveCancelContainer}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: spacing.lg,
      paddingTop: spacing.sm,
    },
    toolsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    toolChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toolChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toolChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    toolChipTextActive: {
      color: colors.white,
    },
    optionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    colorsContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    colorSwatch: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    colorSwatchWhite: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorSwatchSelected: {
      borderWidth: 3,
      borderColor: colors.primary,
    },
    strokeContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    strokeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    strokeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    strokeDot: {
      // dynamic styles applied inline
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    undoRedoContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconBtnDisabled: {
      opacity: 0.4,
    },
    saveCancelContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    saveBtn: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.white,
    },
  });
