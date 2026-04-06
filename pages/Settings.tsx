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
  ILS: '\₪',
  USD: '$',
  EUR: '\€',
};

const currencyNames: Record<Currency, string> = {
  ILS: 'שקל ישראלי',
  USD: 'דולר אמריקאי',
  EUR: 'אירו',
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
      'מחיקת נתונים',
      'האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו בלתי הפיכה!',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'user_profile',
                SETTINGS_STORAGE_KEY,
              ]);
              Alert.alert('הנתונים נמחקו בהצלחה');
            } catch (err) {
              Alert.alert('שגיאה', 'לא ניתן למחוק את הנתונים');
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
        return 'הגדרות';
      case 'terms':
        return 'תקנון';
      case 'privacy':
        return 'פרטיות';
      case 'about':
        return 'אודות';
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
          <Text style={styles.cardHeaderText}>{'מטבע ברירת מחדל'}</Text>
        </View>
        <View style={styles.currencyToggleRow}>
          <MaterialIcons name="payment" size={20} color={colors.primary} />
          <Text style={styles.settingLabel}>{'בחר מטבע'}</Text>
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
          <Text style={styles.cardHeaderText}>{'הגדרות אפליקציה'}</Text>
        </View>

        {/* Language */}
        <View style={[styles.settingItem, styles.settingItemBorder]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="language" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'שפה'}</Text>
          </View>
          <Text style={styles.settingValue}>{'עברית'}</Text>
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
            <Text style={styles.settingLabel}>{'התראות'}</Text>
          </View>
          {renderToggle(notifications)}
        </TouchableOpacity>

        {/* Theme placeholder */}
        <View style={[styles.settingItem, styles.settingItemBorder]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="dark-mode" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'עיצוב'}</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{'כהה'}</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{'בקרוב'}</Text>
            </View>
          </View>
        </View>

        {/* Export placeholder */}
        <View style={[styles.settingItem, styles.settingItemBorder]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="file-download" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>{'ייצוא נתונים'}</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>CSV</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{'בקרוב'}</Text>
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
            <Text style={styles.settingLabel}>{'גיבוי אוטומטי'}</Text>
          </View>
          {renderToggle(autoBackup)}
        </TouchableOpacity>
      </DarkCard>

      {/* Data Management */}
      <DarkCard style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{'ניהול נתונים'}</Text>
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearData}
        >
          <View style={styles.settingLeft}>
            <MaterialIcons name="delete-forever" size={20} color={colors.error} />
            <Text style={[styles.settingLabel, { color: colors.error }]}>
              {'מחיקת כל הנתונים'}
            </Text>
          </View>
          <MaterialIcons name="chevron-left" size={20} color={colors.error} />
        </TouchableOpacity>
      </DarkCard>

      {/* Legal */}
      <DarkCard style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{'מידע משפטי'}</Text>
        </View>

        {[
          {
            icon: 'gavel' as const,
            label: 'תקנון השימוש',
            section: 'terms' as const,
          },
          {
            icon: 'privacy-tip' as const,
            label: 'מדיניות פרטיות',
            section: 'privacy' as const,
          },
          {
            icon: 'info' as const,
            label: 'אודות האפליקציה',
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
        <Text style={styles.versionText}>SASOMM {'גרסה'} 1.0.0</Text>
        <Text style={styles.versionSubtext}>{'כל הזכויות שמורות'} 2024</Text>
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
        <Text style={styles.backLinkText}>{'חזרה להגדרות'}</Text>
      </TouchableOpacity>

      <DarkCard style={styles.contentCard}>
        <View style={styles.contentTitleRow}>
          <MaterialIcons name="gavel" size={22} color={colors.primary} />
          <Text style={styles.contentTitle}>
            {'תקנון השימוש באפליקציית SASOMM'}
          </Text>
        </View>

        {[
          {
            title: '1. כללי',
            body: 'ברוכים הבאים לאפליקציית SASOMM - מערכת לניהול פיננסי אישי ועסקי. השימוש באפליקציה כפוף לתנאים המפורטים בתקנון זה.',
          },
          {
            title: '2. השירותים',
            body: 'האפליקציה מאפשרת ניהול פרויקטים ותקציבים, מעקב אחר הכנסות והוצאות, ניהול ספקים ואנשי קשר, הפקת דוחות כספיים, ושליחת תזכורות ודוחות בוואטסאפ.',
          },
          {
            title: '3. אחריות המשתמש',
            body: 'המשתמש אחראי לדיוק המידע שהוא מזין לאפליקציה, לשמירה על סודיות פרטי הגישה שלו, ולא להשתמש באפליקציה למטרות בלתי חוקיות.',
          },
          {
            title: '4. הגבלת אחריות',
            body: 'האפליקציה מסופקת "כמות שהיא" (AS IS). אנו לא נושאים באחריות לכל נזק ישיר או עקיף שעלול להיגרם כתוצאה מהשימוש באפליקציה.',
          },
        ].map((section, i) => (
          <View key={i} style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>{section.title}</Text>
            <Text style={styles.legalSectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.legalFooter}>
          <Text style={styles.legalFooterText}>{'עדכון אחרון: פברואר'} 2024</Text>
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
        <Text style={styles.backLinkText}>{'חזרה להגדרות'}</Text>
      </TouchableOpacity>

      <DarkCard style={styles.contentCard}>
        <View style={styles.contentTitleRow}>
          <MaterialIcons name="privacy-tip" size={22} color={colors.primary} />
          <Text style={styles.contentTitle}>{'מדיניות פרטיות'}</Text>
        </View>

        {[
          {
            title: '1. איסוף מידע',
            body: 'אנו אוספים פרטים אישיים (שם, אימייל, טלפון), נתונים פיננסיים (הכנסות, הוצאות, תקציבים), פרטי ספקים, ותמונות קבלות ומסמכים.',
          },
          {
            title: '2. שימוש במידע',
            body: 'המידע משמש אך ורק לאספקת שירותי האפליקציה, שיפור חוויית המשתמש, יצירת דוחות וסטטיסטיקות אישיות, ושליחת התראות ותזכורות.',
          },
          {
            title: '3. אחסון מידע',
            body: 'המידע נשמר באופן מאובטח במכשיר ובשרתי Supabase. אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלך.',
          },
          {
            title: '4. זכויות המשתמש',
            body: 'הנך רשאי בכל עת לעיין במידע, לתקן מידע שגוי, למחוק את המידע שלך, ולייצא את הנתונים שלך.',
          },
        ].map((section, i) => (
          <View key={i} style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>{section.title}</Text>
            <Text style={styles.legalSectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.legalFooter}>
          <Text style={styles.legalFooterText}>{'עדכון אחרון: פברואר'} 2024</Text>
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
        <Text style={styles.backLinkText}>{'חזרה להגדרות'}</Text>
      </TouchableOpacity>

      <DarkCard style={styles.aboutCard}>
        <Text style={styles.aboutAppName}>SASOMM</Text>
        <Text style={styles.aboutDesc}>{'ניהול פיננסי חכם ופשוט'}</Text>

        <Text style={styles.aboutBody}>
          SASOMM{' '}
          {'היא אפליקציה לניהול פיננסי המאפשרת לך לעקוב אחר ההכנסות וההוצאות שלך, לנהל פרויקטים ותקציבים, ולשמור על קשר עם ספקים ואנשי קשר.'}
        </Text>

        <View style={styles.aboutInfoCard}>
          <View style={styles.aboutInfoRow}>
            <Text style={styles.aboutInfoLabel}>{'גרסה'}</Text>
            <Text style={styles.aboutInfoValue}>1.0.0</Text>
          </View>
          <View style={[styles.aboutInfoRow, styles.aboutInfoRowBorder]}>
            <Text style={styles.aboutInfoLabel}>{'תאריך עדכון'}</Text>
            <Text style={styles.aboutInfoValue}>{'פברואר'} 2024</Text>
          </View>
          <View style={[styles.aboutInfoRow, styles.aboutInfoRowBorder]}>
            <Text style={styles.aboutInfoLabel}>{'מפתח'}</Text>
            <Text style={styles.aboutInfoValue}>SASOMM Team</Text>
          </View>
        </View>

        <Text style={styles.featuresTitle}>{'תכונות עיקריות'}</Text>
        <View style={styles.featuresGrid}>
          {[
            { icon: 'folder' as const, label: 'ניהול פרויקטים' },
            { icon: 'payment' as const, label: 'מעקב הוצאות' },
            { icon: 'add-card' as const, label: 'ניהול הכנסות' },
            { icon: 'groups' as const, label: 'ספקים ואנשי קשר' },
            { icon: 'analytics' as const, label: 'דוחות מפורטים' },
            { icon: 'share' as const, label: 'שיתוף בוואטסאפ' },
          ].map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <MaterialIcons name={feature.icon} size={16} color={colors.primary} />
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </DarkCard>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>{'כל הזכויות שמורות'} 2024</Text>
        <Text style={styles.versionSubtext}>{'נבנה באהבה'}</Text>
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
