import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, radii } from '../../theme';

interface FilterPillsProps {
  filters: string[];
  activeFilter: string;
  onSelect: (filter: string) => void;
}

export function FilterPills({ filters, activeFilter, onSelect }: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {filters.map((filter) => {
        const isActive = filter === activeFilter;
        return (
          <Pressable
            key={filter}
            onPress={() => onSelect(filter)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {filter}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.glassWhite,
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  pillActive: {
    backgroundColor: 'rgba(0,217,217,0.15)',
    borderColor: 'rgba(0,217,217,0.3)',
  },
  pillText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  pillTextActive: {
    color: colors.primary,
  },
});
