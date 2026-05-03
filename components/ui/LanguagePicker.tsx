import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLocale, SUPPORTED_LOCALES, getCurrentLocale, type Locale } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../../theme';

interface LanguagePickerProps {
  variant?: 'card' | 'inline';
}

export function LanguagePicker({ variant = 'card' }: LanguagePickerProps): React.ReactElement {
  const { t } = useTranslation();
  const [active, setActive] = useState<Locale>(getCurrentLocale());

  const handleSelect = async (next: Locale): Promise<void> => {
    if (next === active) return;
    const { rtlChanged } = await setLocale(next);
    setActive(next);

    // Auto-apply: on web reload immediately so layout direction flips.
    // On native the choice is already persisted; the new layout takes
    // effect on next app launch.
    if (rtlChanged && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <View style={[styles.row, variant === 'inline' && styles.rowInline]}>
      {SUPPORTED_LOCALES.map((loc) => {
        const isActive = loc === active;
        return (
          <TouchableOpacity
            key={loc}
            onPress={() => handleSelect(loc)}
            style={[
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                isActive ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              {t(`language.${loc}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowInline: {
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    minWidth: 88,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
  },
  pillTextActive: {
    color: colors.bgPrimary,
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
});
