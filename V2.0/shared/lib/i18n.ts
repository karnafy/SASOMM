import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import he from './locales/he.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

export type Locale = 'he' | 'en' | 'fr';
export const SUPPORTED_LOCALES: Locale[] = ['he', 'en', 'fr'];
const RTL_LOCALES: Locale[] = ['he'];
const STORAGE_KEY = 'sasomm.locale';

function detectInitialLocale(): Locale {
  const deviceLocales = Localization.getLocales?.() || [];
  const deviceTag = (deviceLocales[0]?.languageCode || '').toLowerCase();
  if (SUPPORTED_LOCALES.includes(deviceTag as Locale)) {
    return deviceTag as Locale;
  }
  return 'he';
}

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Initialize i18next with the user's saved locale (or device default).
 * Sets RTL direction synchronously so the rest of the app boots in the
 * correct layout. Returns the resolved locale and whether a layout
 * direction change was applied (caller may want to prompt for restart).
 */
export async function initI18n(): Promise<{ locale: Locale; rtlChanged: boolean }> {
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // ignore — first launch or storage unavailable
  }

  const resolved: Locale = SUPPORTED_LOCALES.includes(saved as Locale)
    ? (saved as Locale)
    : detectInitialLocale();

  // Sanity check on imported resources — empty objects mean the bundler
  // didn't pick the JSON up and t() would silently return keys.
  const heKeys = Object.keys(he || {}).length;
  const enKeys = Object.keys(en || {}).length;
  const frKeys = Object.keys(fr || {}).length;
  if (heKeys === 0 || enKeys === 0 || frKeys === 0) {
    console.warn('[i18n] locale resources missing or empty', { heKeys, enKeys, frKeys });
  }

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        he: { translation: he as Record<string, unknown> },
        en: { translation: en as Record<string, unknown> },
        fr: { translation: fr as Record<string, unknown> },
      },
      lng: resolved,
      fallbackLng: 'he',
      interpolation: { escapeValue: false },
      returnNull: false,
      debug: false,
    });
    console.log('[i18n] initialized', { lng: resolved, heKeys, enKeys, frKeys });
  } else {
    await i18n.changeLanguage(resolved);
  }

  const wantsRTL = isRTL(resolved);
  const rtlChanged = I18nManager.isRTL !== wantsRTL;
  if (rtlChanged && Platform.OS !== 'web') {
    I18nManager.allowRTL(wantsRTL);
    I18nManager.forceRTL(wantsRTL);
  } else if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = wantsRTL ? 'rtl' : 'ltr';
  }

  return { locale: resolved, rtlChanged };
}

/**
 * Change the active locale. Persists the choice and updates RTL.
 * On native this requires an app reload to fully apply (caller decides
 * whether to prompt the user). Returns whether a layout flip happened.
 */
export async function setLocale(next: Locale): Promise<{ rtlChanged: boolean }> {
  await AsyncStorage.setItem(STORAGE_KEY, next);
  await i18n.changeLanguage(next);

  const wantsRTL = isRTL(next);
  const rtlChanged = I18nManager.isRTL !== wantsRTL;
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = wantsRTL ? 'rtl' : 'ltr';
  } else if (rtlChanged) {
    I18nManager.allowRTL(wantsRTL);
    I18nManager.forceRTL(wantsRTL);
  }

  return { rtlChanged };
}

export function getCurrentLocale(): Locale {
  const lng = (i18n.language || 'he').slice(0, 2).toLowerCase();
  return SUPPORTED_LOCALES.includes(lng as Locale) ? (lng as Locale) : 'he';
}

export default i18n;
