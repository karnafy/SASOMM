import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../../theme';

interface FilterPillsProps {
  filters: string[];
  activeFilter: string;
  onSelect: (filter: string) => void;
}

const FULL_WIDTH_THRESHOLD = 5;

export function FilterPills({ filters, activeFilter, onSelect }: FilterPillsProps) {
  // <=5 filters → distribute across full width.
  // >5 filters → fall back to horizontal scroll so labels don't get squeezed.
  const distribute = filters.length > 0 && filters.length <= FULL_WIDTH_THRESHOLD;

  const Pills = (
    <>
      {filters.map((filter) => {
        const isActive = filter === activeFilter;
        return (
          <Pressable
            key={filter}
            onPress={() => onSelect(filter)}
            style={[
              styles.pill,
              distribute && styles.pillFlex,
              isActive && styles.pillActive,
            ]}
          >
            <Text
              style={[styles.pillText, isActive && styles.pillTextActive]}
              numberOfLines={1}
            >
              {filter}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  if (distribute) {
    return <View style={styles.fullRow}>{Pills}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {Pills}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  scrollContent: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radii.full,
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.transparent,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillFlex: {
    flex: 1,
    paddingHorizontal: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(0,217,217,0.15)',
    borderColor: 'rgba(0,217,217,0.3)',
  },
  pillText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  pillTextActive: {
    color: colors.primary,
  },
});
