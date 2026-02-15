import React from 'react';
import { Text, TextStyle } from 'react-native';
import { formatMoney } from '../../lib/format';
import { typography } from '../../theme';

interface MoneyTextProps {
  cents: number;
  size?: 'default' | 'large';
  color?: string;
  style?: TextStyle;
}

export function MoneyText({ cents, size = 'default', color, style }: MoneyTextProps) {
  return (
    <Text
      style={[
        size === 'large' ? typography.moneyLarge : typography.money,
        color ? { color } : undefined,
        style,
      ]}
    >
      {formatMoney(cents)}
    </Text>
  );
}
