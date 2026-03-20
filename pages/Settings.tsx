import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen, Currency } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { DarkCard } from '../components/ui/DarkCard';
import { CurrencyToggle } from '../components/ui/CurrencyToggle';

interface SettingsProps {
  onNavigate: (screen: AppScreen) => void;
  goBack: () => void;
  globalCurrency: Currency;
  setGlobalCurrency?: (currency: Currency) => void;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const currencyNames: Record<Currency, string> = {
  ILS: '\u05E9\u05E7\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC\u05D9',
  USD: '\u05D3\u05D5\u05DC\u05E8 \u05D0\u05DE\u05E8\u05D9\u05E7\u05D0\u05D9',
  EUR: '\u05D0\u05D9\u05E8\u05D5',
};

const SETTINGS_STORAGE_KEY = 'app_settings';

const Settings: React.FC<SettingsProps> = ({
  onNavigate,
  goBack,
  globalCurrency,
  setGlobalCurrency,
}) => {
  const [activeSection, setActiveSection] = useState<
    'settings' | 'terms' | 'privacy' | 'about'
  >('settings');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const settings = JSON.parse(saved);
          setNotifications(settings.notifications ?? true);
          setDarkMode(settings.darkMode ?? false);
          setAutoBackup(settings.autoBackup ?? true);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const saveSetting = async (key: string, value: boolean) => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = saved ? JSON.parse(saved) : {};
      settings[key] = value;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '\u05DE\u05D7\u05D9\u05E7\u05EA \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD',
      '\u05D4\u05D0\u05DD \u05D0\u05EA\u05D4 \u05D1\u05D8\u05D5\u05D7 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05DE\u05D7\u05D5\u05E7 \u05D0\u05EA \u05DB\u05DC \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD? \u05E4\u05E2\u05D5\u05DC\u05D4 \u05D6\u05D5 \u05D1\u05DC\u05EA\u05D9 \u05D4\u05E4\u05D9\u05DB\u05D4!',
      [
        { text: '\u05D1\u05D9\u05D8\u05D5\u05DC', style: 'cancel' },
        {
          text: '\u05DE\u05D7\u05E7',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'user_profile',
                SETTINGS_STORAGE_KEY,
              ]);
              Alert.alert('\u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E0\u05DE\u05D7\u05E7\u05D5 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4');
            } catch (err) {
              Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05DE\u05D7\u05D5\u05E7 \u05D0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (activeSection === 'settings') {
      goBack();
    } else {
      setActiveSection('settings');
    }
  };

  const getTitle = () => {
    switch (activeSection) {
      case 'settings':
        return '\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA';
      case 'terms':
        return '\u05EA\u05E7\u05E0\u05D5\u05DF';
      case 'privacy':
        return '\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA';
      case 'about':
        return '\u05D0\u05D5\u05D3\u05D5\u05EA';
    }
  };

  const renderToggle = (value: boolean) => (
    <View
      style={[
        styles.toggle,
        { backgroundColor: value ? colors.success : colors.bgTertiary },
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          value ? styles.toggleThumbOn : styles.toggleThumbOff,
        ]}
      />
    </View>
  );

  const renderSettings = () => (
    <View style={styles.sections}>
      {/* Default Currency — CurrencyToggle */}
      <DarkCard style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{'\u05DE\u05D8\u05D1\u05E2 \u05D1\u05E8\u05D9\u05E8\u05EA \u05DE\u05D7\u05D3\u05DC'}</Text>
        </View>
        <View style={styles.currencyToggleRow}>
          <MaterialIcons name="payment" size={20} color={colors.primary} />
          <Text style={styles.settingLabel}>{'\u05D1\u05D7\u05E8 \u05DE\u05D8\u05D1\u05E2'}</Text>
          <View style={styles.currencyToggleWrapper}>
            {setGlobalCurrency ? (
              <CurrencyToggle
                selected={globalCurrency}
                onSelect={setGlobalCurrency}
              />
            ) : (
              <Text style={styles.settingValue}>
                {currencySymbols[globalCurrency]} {globalCurrency}
              </Text>
            )}
          </View>
        </View>
      </DarkCard>

      {/* App Settings */}
      <DarkCard style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{'\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA \u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4'}</Text>
        </View>

        {/* Language */}
        <View style={[styles.settingItem, styles.settingItemBorder]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="language" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'\u05E9\u05E4\u05D4'}</Text>
          </View>
          <Text style={styles.settingValue}>{'\u05E2\u05D1\u05E8\u05D9\u05EA'}</Text>
        </View>

        {/* Notifications */}
        <TouchableOpacity
          style={[styles.settingItem, styles.settingItemBorder]}
          onPress={() => {
            const newVal = !notifications;
            setNotifications(newVal);
            saveSetting('notifications', newVal);
          }}
        >
          <View style={styles.settingLeft}>
            <MaterialIcons name="notifications" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA'}</Text>
          </View>
          {renderToggle(notifications)}
        </TouchableOpacity>

        {/* Theme placeholder */}
        <View style={[styles.settingItem, styles.settingItemBorder]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="dark-mode" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'\u05E2\u05D9\u05E6\u05D5\u05D1'}</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{'\u05DB\u05D4\u05D4'}</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{'\u05D1\u05E7\u05E8\u05D5\u05D1'}</Text>
            </View>
          </View>
        </View>

        {/* Export placeholder */}
        <View style={[styles.settingItem, styles.settingItemBorder]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="file-download" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'\u05D9\u05D9\u05E6\u05D5\u05D0 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD'}</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>CSV</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{'\u05D1\u05E7\u05E8\u05D5\u05D1'}</Text>
            </View>
          </View>
        </View>

        {/* Auto Backup */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const newVal = !autoBackup;
            setAutoBackup(newVal);
            saveSetting('autoBackup', newVal);
          }}
        >
          <View style={styles.settingLeft}>
            <MaterialIcons name="backup" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'\u05D2\u05D9\u05D1\u05D5\u05D9 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9'}</Text>
          </View>
          {renderToggle(autoBackup)}
        </TouchableOpacity>
      </DarkCard>

      {/* Data Management */}
      <DarkCard style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{'\u05E0\u05D9\u05D4\u05D5\u05DC \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD'}</Text>
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearData}
        >
          <View style={styles.settingLeft}>
            <MaterialIcons name="delete-forever" size={20} color={colors.error} />
            <Text style={[styles.settingLabel, { color: colors.error }]}>
              {'\u05DE\u05D7\u05D9\u05E7\u05EA \u05DB\u05DC \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD'}
            </Text>
          </View>
          <MaterialIcons name="chevron-left" size={20} color={colors.error} />
        </TouchableOpacity>
      </DarkCard>

      {/* Legal */}
      <DarkCard style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{'\u05DE\u05D9\u05D3\u05E2 \u05DE\u05E9\u05E4\u05D8\u05D9'}</Text>
        </View>

        {[
          {
            icon: 'gavel' as const,
            label: '\u05EA\u05E7\u05E0\u05D5\u05DF \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9',
            section: 'terms' as const,
          },
          {
            icon: 'privacy-tip' as const,
            label: '\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA',
            section: 'privacy' as const,
          },
          {
            icon: 'info' as const,
            label: '\u05D0\u05D5\u05D3\u05D5\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4',
            section: 'about' as const,
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.settingItem, i < 2 && styles.settingItemBorder]}
            onPress={() => setActiveSection(item.section)}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons
                name={item.icon}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
            <MaterialIcons
              name="chevron-left"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </DarkCard>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>MONNY {'\u05D2\u05E8\u05E1\u05D4'} 1.0.0</Text>
        <Text style={styles.versionSubtext}>{'\u05DB\u05DC \u05D4\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05E9\u05DE\u05D5\u05E8\u05D5\u05EA'} 2024</Text>
      </View>
    </View>
  );

  const renderTerms = () => (
    <View style={styles.sections}>
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setActiveSection('settings')}
      >
        <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
        <Text style={styles.backLinkText}>{'\u05D7\u05D6\u05E8\u05D4 \u05DC\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA'}</Text>
      </TouchableOpacity>

      <DarkCard style={styles.contentCard}>
        <View style={styles.contentTitleRow}>
          <MaterialIcons name="gavel" size={22} color={colors.primary} />
          <Text style={styles.contentTitle}>
            {'\u05EA\u05E7\u05E0\u05D5\u05DF \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D1\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA MONNY'}
          </Text>
        </View>

        {[
          {
            title: '1. \u05DB\u05DC\u05DC\u05D9',
            body: '\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD \u05DC\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA MONNY - \u05DE\u05E2\u05E8\u05DB\u05EA \u05DC\u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9 \u05D0\u05D9\u05E9\u05D9 \u05D5\u05E2\u05E1\u05E7\u05D9. \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D1\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05DB\u05E4\u05D5\u05E3 \u05DC\u05EA\u05E0\u05D0\u05D9\u05DD \u05D4\u05DE\u05E4\u05D5\u05E8\u05D8\u05D9\u05DD \u05D1\u05EA\u05E7\u05E0\u05D5\u05DF \u05D6\u05D4.',
          },
          {
            title: '2. \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA\u05D9\u05DD',
            body: '\u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05DE\u05D0\u05E4\u05E9\u05E8\u05EA \u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05D5\u05EA\u05E7\u05E6\u05D9\u05D1\u05D9\u05DD, \u05DE\u05E2\u05E7\u05D1 \u05D0\u05D7\u05E8 \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA, \u05E0\u05D9\u05D4\u05D5\u05DC \u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8, \u05D4\u05E4\u05E7\u05EA \u05D3\u05D5\u05D7\u05D5\u05EA \u05DB\u05E1\u05E4\u05D9\u05D9\u05DD, \u05D5\u05E9\u05DC\u05D9\u05D7\u05EA \u05EA\u05D6\u05DB\u05D5\u05E8\u05D5\u05EA \u05D5\u05D3\u05D5\u05D7\u05D5\u05EA \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4.',
          },
          {
            title: '3. \u05D0\u05D7\u05E8\u05D9\u05D5\u05EA \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9',
            body: '\u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D0\u05D7\u05E8\u05D0\u05D9 \u05DC\u05D3\u05D9\u05D5\u05E7 \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05D4\u05D5\u05D0 \u05DE\u05D6\u05D9\u05DF \u05DC\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4, \u05DC\u05E9\u05DE\u05D9\u05E8\u05D4 \u05E2\u05DC \u05E1\u05D5\u05D3\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9 \u05D4\u05D2\u05D9\u05E9\u05D4 \u05E9\u05DC\u05D5, \u05D5\u05DC\u05D0 \u05DC\u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05DC\u05DE\u05D8\u05E8\u05D5\u05EA \u05D1\u05DC\u05EA\u05D9 \u05D7\u05D5\u05E7\u05D9\u05D5\u05EA.',
          },
          {
            title: '4. \u05D4\u05D2\u05D1\u05DC\u05EA \u05D0\u05D7\u05E8\u05D9\u05D5\u05EA',
            body: '\u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05DE\u05E1\u05D5\u05E4\u05E7\u05EA "\u05DB\u05DE\u05D5\u05EA \u05E9\u05D4\u05D9\u05D0" (AS IS). \u05D0\u05E0\u05D5 \u05DC\u05D0 \u05E0\u05D5\u05E9\u05D0\u05D9\u05DD \u05D1\u05D0\u05D7\u05E8\u05D9\u05D5\u05EA \u05DC\u05DB\u05DC \u05E0\u05D6\u05E7 \u05D9\u05E9\u05D9\u05E8 \u05D0\u05D5 \u05E2\u05E7\u05D9\u05E3 \u05E9\u05E2\u05DC\u05D5\u05DC \u05DC\u05D4\u05D9\u05D2\u05E8\u05DD \u05DB\u05EA\u05D5\u05E6\u05D0\u05D4 \u05DE\u05D4\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D1\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4.',
          },
        ].map((section, i) => (
          <View key={i} style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>{section.title}</Text>
            <Text style={styles.legalSectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.legalFooter}>
          <Text style={styles.legalFooterText}>{'\u05E2\u05D3\u05DB\u05D5\u05DF \u05D0\u05D7\u05E8\u05D5\u05DF: \u05E4\u05D1\u05E8\u05D5\u05D0\u05E8'} 2024</Text>
        </View>
      </DarkCard>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.sections}>
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setActiveSection('settings')}
      >
        <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
        <Text style={styles.backLinkText}>{'\u05D7\u05D6\u05E8\u05D4 \u05DC\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA'}</Text>
      </TouchableOpacity>

      <DarkCard style={styles.contentCard}>
        <View style={styles.contentTitleRow}>
          <MaterialIcons name="privacy-tip" size={22} color={colors.primary} />
          <Text style={styles.contentTitle}>{'\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA'}</Text>
        </View>

        {[
          {
            title: '1. \u05D0\u05D9\u05E1\u05D5\u05E3 \u05DE\u05D9\u05D3\u05E2',
            body: '\u05D0\u05E0\u05D5 \u05D0\u05D5\u05E1\u05E4\u05D9\u05DD \u05E4\u05E8\u05D8\u05D9\u05DD \u05D0\u05D9\u05E9\u05D9\u05D9\u05DD (\u05E9\u05DD, \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC, \u05D8\u05DC\u05E4\u05D5\u05DF), \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9\u05D9\u05DD (\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA, \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA, \u05EA\u05E7\u05E6\u05D9\u05D1\u05D9\u05DD), \u05E4\u05E8\u05D8\u05D9 \u05E1\u05E4\u05E7\u05D9\u05DD, \u05D5\u05EA\u05DE\u05D5\u05E0\u05D5\u05EA \u05E7\u05D1\u05DC\u05D5\u05EA \u05D5\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD.',
          },
          {
            title: '2. \u05E9\u05D9\u05DE\u05D5\u05E9 \u05D1\u05DE\u05D9\u05D3\u05E2',
            body: '\u05D4\u05DE\u05D9\u05D3\u05E2 \u05DE\u05E9\u05DE\u05E9 \u05D0\u05DA \u05D5\u05E8\u05E7 \u05DC\u05D0\u05E1\u05E4\u05E7\u05EA \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4, \u05E9\u05D9\u05E4\u05D5\u05E8 \u05D7\u05D5\u05D5\u05D9\u05D9\u05EA \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9, \u05D9\u05E6\u05D9\u05E8\u05EA \u05D3\u05D5\u05D7\u05D5\u05EA \u05D5\u05E1\u05D8\u05D8\u05D9\u05E1\u05D8\u05D9\u05E7\u05D5\u05EA \u05D0\u05D9\u05E9\u05D9\u05D5\u05EA, \u05D5\u05E9\u05DC\u05D9\u05D7\u05EA \u05D4\u05EA\u05E8\u05D0\u05D5\u05EA \u05D5\u05EA\u05D6\u05DB\u05D5\u05E8\u05D5\u05EA.',
          },
          {
            title: '3. \u05D0\u05D7\u05E1\u05D5\u05DF \u05DE\u05D9\u05D3\u05E2',
            body: '\u05D4\u05DE\u05D9\u05D3\u05E2 \u05E0\u05E9\u05DE\u05E8 \u05D1\u05D0\u05D5\u05E4\u05DF \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05D1\u05DE\u05DB\u05E9\u05D9\u05E8 \u05D5\u05D1\u05E9\u05E8\u05EA\u05D9 Supabase. \u05D0\u05E0\u05D5 \u05E0\u05D5\u05E7\u05D8\u05D9\u05DD \u05D1\u05D0\u05DE\u05E6\u05E2\u05D9 \u05D0\u05D1\u05D8\u05D7\u05D4 \u05E1\u05D1\u05D9\u05E8\u05D9\u05DD \u05DC\u05D4\u05D2\u05E0\u05D4 \u05E2\u05DC \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DC\u05DA.',
          },
          {
            title: '4. \u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9',
            body: '\u05D4\u05E0\u05DA \u05E8\u05E9\u05D0\u05D9 \u05D1\u05DB\u05DC \u05E2\u05EA \u05DC\u05E2\u05D9\u05D9\u05DF \u05D1\u05DE\u05D9\u05D3\u05E2, \u05DC\u05EA\u05E7\u05DF \u05DE\u05D9\u05D3\u05E2 \u05E9\u05D2\u05D5\u05D9, \u05DC\u05DE\u05D7\u05D5\u05E7 \u05D0\u05EA \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DC\u05DA, \u05D5\u05DC\u05D9\u05D9\u05E6\u05D0 \u05D0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E9\u05DC\u05DA.',
          },
        ].map((section, i) => (
          <View key={i} style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>{section.title}</Text>
            <Text style={styles.legalSectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.legalFooter}>
          <Text style={styles.legalFooterText}>{'\u05E2\u05D3\u05DB\u05D5\u05DF \u05D0\u05D7\u05E8\u05D5\u05DF: \u05E4\u05D1\u05E8\u05D5\u05D0\u05E8'} 2024</Text>
        </View>
      </DarkCard>
    </View>
  );

  const renderAbout = () => (
    <View style={styles.sections}>
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setActiveSection('settings')}
      >
        <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
        <Text style={styles.backLinkText}>{'\u05D7\u05D6\u05E8\u05D4 \u05DC\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA'}</Text>
      </TouchableOpacity>

      <DarkCard style={styles.aboutCard}>
        <Text style={styles.aboutAppName}>MONNY</Text>
        <Text style={styles.aboutDesc}>{'\u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9 \u05D7\u05DB\u05DD \u05D5\u05E4\u05E9\u05D5\u05D8'}</Text>

        <Text style={styles.aboutBody}>
          MONNY{' '}
          {'\u05D4\u05D9\u05D0 \u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05DC\u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9 \u05D4\u05DE\u05D0\u05E4\u05E9\u05E8\u05EA \u05DC\u05DA \u05DC\u05E2\u05E7\u05D5\u05D1 \u05D0\u05D7\u05E8 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05DC\u05DA, \u05DC\u05E0\u05D4\u05DC \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD \u05D5\u05EA\u05E7\u05E6\u05D9\u05D1\u05D9\u05DD, \u05D5\u05DC\u05E9\u05DE\u05D5\u05E8 \u05E2\u05DC \u05E7\u05E9\u05E8 \u05E2\u05DD \u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8.'}
        </Text>

        <View style={styles.aboutInfoCard}>
          <View style={styles.aboutInfoRow}>
            <Text style={styles.aboutInfoLabel}>{'\u05D2\u05E8\u05E1\u05D4'}</Text>
            <Text style={styles.aboutInfoValue}>1.0.0</Text>
          </View>
          <View style={[styles.aboutInfoRow, styles.aboutInfoRowBorder]}>
            <Text style={styles.aboutInfoLabel}>{'\u05EA\u05D0\u05E8\u05D9\u05DA \u05E2\u05D3\u05DB\u05D5\u05DF'}</Text>
            <Text style={styles.aboutInfoValue}>{'\u05E4\u05D1\u05E8\u05D5\u05D0\u05E8'} 2024</Text>
          </View>
          <View style={[styles.aboutInfoRow, styles.aboutInfoRowBorder]}>
            <Text style={styles.aboutInfoLabel}>{'\u05DE\u05E4\u05EA\u05D7'}</Text>
            <Text style={styles.aboutInfoValue}>MONNY Team</Text>
          </View>
        </View>

        <Text style={styles.featuresTitle}>{'\u05EA\u05DB\u05D5\u05E0\u05D5\u05EA \u05E2\u05D9\u05E7\u05E8\u05D9\u05D5\u05EA'}</Text>
        <View style={styles.featuresGrid}>
          {[
            { icon: 'folder' as const, label: '\u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05E8\u05D5\u05D9\u05E7\u05D8\u05D9\u05DD' },
            { icon: 'payment' as const, label: '\u05DE\u05E2\u05E7\u05D1 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA' },
            { icon: 'add-card' as const, label: '\u05E0\u05D9\u05D4\u05D5\u05DC \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA' },
            { icon: 'groups' as const, label: '\u05E1\u05E4\u05E7\u05D9\u05DD \u05D5\u05D0\u05E0\u05E9\u05D9 \u05E7\u05E9\u05E8' },
            { icon: 'analytics' as const, label: '\u05D3\u05D5\u05D7\u05D5\u05EA \u05DE\u05E4\u05D5\u05E8\u05D8\u05D9\u05DD' },
            { icon: 'share' as const, label: '\u05E9\u05D9\u05EA\u05D5\u05E3 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4' },
          ].map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <MaterialIcons name={feature.icon} size={16} color={colors.primary} />
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </DarkCard>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>{'\u05DB\u05DC \u05D4\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05E9\u05DE\u05D5\u05E8\u05D5\u05EA'} 2024</Text>
        <Text style={styles.versionSubtext}>{'\u05E0\u05D1\u05E0\u05D4 \u05D1\u05D0\u05D4\u05D1\u05D4'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <ScreenTopBar title={getTitle()} onBack={handleBack} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'settings' && renderSettings()}
        {activeSection === 'terms' && renderTerms()}
        {activeSection === 'privacy' && renderPrivacy()}
        {activeSection === 'about' && renderAbout()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topBar: {
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },
  sections: {
    gap: 16,
  },

  // Settings Card
  settingsCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  cardHeaderText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Currency toggle row
  currencyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    gap: 10,
  },
  currencyToggleWrapper: {
    flex: 1,
    alignItems: 'flex-start',
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 15,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  settingValue: {
    fontSize: 13,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Coming soon badge
  comingSoonBadge: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  comingSoonText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },

  // Toggle
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-start',
  },
  toggleThumbOff: {
    alignSelf: 'flex-end',
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  versionSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },

  // Back link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Content Card
  contentCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  contentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    flex: 1,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Legal
  legalSection: {
    marginBottom: 16,
  },
  legalSectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  legalSectionBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  legalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
    paddingTop: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  legalFooterText: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  // About
  aboutCard: {
    borderRadius: radii.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  aboutAppName: {
    fontSize: 28,
    fontFamily: fonts.extrabold,
    color: colors.primary,
    marginBottom: 8,
  },
  aboutDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  aboutBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  aboutInfoCard: {
    width: '100%',
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 20,
  },
  aboutInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aboutInfoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
  },
  aboutInfoLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  aboutInfoValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  featuresTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  featureLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
});

export default Settings;
