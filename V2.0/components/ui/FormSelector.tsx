import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, radii } from '../../theme';

interface FormSelectorProps {
  label: string;
  value?: string;
  displayValue?: string;
  onPress: () => void;
  icon?: string;
  placeholder?: string;
}

export function FormSelector({
  label,
  value,
  displayValue,
  onPress,
  icon,
  placeholder,
}: FormSelectorProps) {
  const shownText = displayValue ?? value;
  const hasValue = Boolean(shownText);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
      >
        {/* Left side: chevron (RTL leading = left visually) */}
        <MaterialIcons
          name="chevron-left"
          size={20}
          color={colors.textTertiary}
        />

        {/* Right side: optional icon + value/placeholder */}
        <View style={styles.rightContent}>
          {icon ? (
            <MaterialIcons
              name={icon as any}
              size={16}
              color={hasValue ? colors.textPrimary : colors.textTertiary}
              style={styles.leadingIcon}
            />
          ) : null}
          <Text
            style={[styles.valueText, !hasValue && styles.placeholderText]}
            numberOfLines={1}
          >
            {hasValue ? shownText : (placeholder ?? '')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.semibold,
    marginBottom: 6,
    textAlign: 'right',
  },
  selector: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  leadingIcon: {
    marginLeft: 6,
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'right',
  },
  placeholderText: {
    color: colors.textTertiary,
  },
});
