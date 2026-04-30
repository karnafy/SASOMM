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
    <View style={styles.wrap}>
      {/* "הצג הכל" link — its own row above the title, aligned to the LEFT */}
      {linkText ? (
        <View style={styles.linkRow}>
          <Pressable onPress={onLinkPress} style={styles.link}>
            <Text style={styles.linkText}>{linkText}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Title — its own row, right-aligned */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  linkRow: {
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  link: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  linkText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
