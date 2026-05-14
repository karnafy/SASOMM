import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../../theme';
import type { Currency } from '../../shared/types';

const CURRENCIES: { code: Currency; symbol: string }[] = [
  { code: 'ILS', symbol: '₪' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
];

interface CurrencyToggleProps {
  selected: Currency;
  onSelect: (currency: Currency) => void;
}

export function CurrencyToggle({ selected, onSelect }: CurrencyToggleProps) {
  return (
    <View style={styles.container}>
      {CURRENCIES.map(({ code, symbol }) => {
        const isActive = selected === code;
        return (
          <Pressable
            key={code}
            onPress={() => onSelect(code)}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text style={[styles.symbol, isActive && styles.symbolActive]}>
              {symbol}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.glassWhite,
    borderRadius: radii['2xl'] - 6, // 18
    padding: 3,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: colors.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  symbol: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  symbolActive: {
    color: colors.bgPrimary,
  },
});
