import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

interface SectionHeaderProps {
  title: string;
  linkText?: string;
  onLinkPress?: () => void;
}

export function SectionHeader({ title, linkText, onLinkPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      {/* Link on the left end (RTL layout: end = left visually) */}
      {linkText ? (
        <Pressable onPress={onLinkPress} style={styles.link}>
          <Text style={styles.linkText}>{linkText}</Text>
        </Pressable>
      ) : null}

      {/* Title on the right start (RTL layout: start = right visually) */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  link: {
    paddingVertical: 2,
  },
  linkText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
