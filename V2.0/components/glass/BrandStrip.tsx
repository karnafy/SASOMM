// Brand strip — small SASOMM logo + language+currency quick switcher.
// Shown at the top of every screen so language/currency are always visible.
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, radii, fonts } from '../../theme';

interface BrandStripProps {
  language?: string;
  currency?: string;
  onSwitcherPress?: () => void;
}

export function BrandStrip({ language = 'עברית', currency = '₪ ILS', onSwitcherPress }: BrandStripProps) {
  return (
    <View style={styles.row}>
      <Image source={require('../../assets/logo-sasomm.png')} style={styles.logo} resizeMode="contain" />
      <Pressable onPress={onSwitcherPress} style={styles.pill}>
        <Text style={styles.pillText}>{language}</Text>
        <View style={styles.divider} />
        <Text style={styles.pillText}>{currency}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 12,
  },
  logo: {
    width: 80,
    height: 24,
    // drop shadow for the glow effect
    // @ts-ignore — web only
    filter: 'drop-shadow(0 0 6px rgba(0,217,217,0.4))',
  },
  pill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,217,217,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.3)',
  },
  pillText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 11,
    backgroundColor: 'rgba(0,217,217,0.4)',
    marginHorizontal: 2,
  },
});
