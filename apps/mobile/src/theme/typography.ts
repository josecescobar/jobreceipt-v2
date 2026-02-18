import { TextStyle } from 'react-native';
import { colors, type ThemeColors } from './colors';

export function createTypography(palette: ThemeColors) {
  return {
    h1: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.text,
      letterSpacing: -0.5,
    } as TextStyle,

    h2: {
      fontSize: 22,
      fontWeight: '600',
      color: palette.text,
      letterSpacing: -0.3,
    } as TextStyle,

    h3: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
    } as TextStyle,

    body: {
      fontSize: 16,
      fontWeight: '400',
      color: palette.text,
      lineHeight: 24,
    } as TextStyle,

    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      color: palette.textSecondary,
      lineHeight: 20,
    } as TextStyle,

    caption: {
      fontSize: 12,
      fontWeight: '400',
      color: palette.textMuted,
      lineHeight: 16,
    } as TextStyle,

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    } as TextStyle,

    money: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
      fontVariant: ['tabular-nums'],
    } as TextStyle,

    moneyLarge: {
      fontSize: 32,
      fontWeight: '700',
      color: palette.text,
      fontVariant: ['tabular-nums'],
    } as TextStyle,
  } as const;
}

// Static default for non-component code
export const typography = createTypography(colors);
