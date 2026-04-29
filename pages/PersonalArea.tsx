import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Currency, confirmDialog } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { AvatarCircle } from '../components/ui/AvatarCircle';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';

interface PersonalAreaProps {
  onNavigate: (screen: AppScreen) => void;
  goBack: () => void;
  globalCurrency: Currency;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\₪',
  USD: '$',
  EUR: '\€',
};

const PROFILE_STORAGE_KEY = 'user_profile';

const PersonalArea: React.FC<PersonalAreaProps> = ({
  onNavigate,
  goBack,
  globalCurrency,
}) => {
  const [userName, setUserName] = useState('משתמש');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [userPhone, setUserPhone] = useState('050-1234567');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) {
          const profile = JSON.parse(saved);
          setUserName(profile.name || 'משתמש');
          setUserEmail(profile.email || '');
          setUserPhone(profile.phone || '');
          setUserAvatar(profile.avatar || null);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, []);

  const handlePickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const permResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permResult.granted) {
          Alert.alert('שגיאה', 'נדרשת הרשאת גישה למצלמה');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setUserAvatar(uri);
          await saveAvatarToStorage(uri);
        }
      } else {
        const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permResult.granted) {
          Alert.alert('שגיאה', 'נדרשת הרשאת גישה לגלריה');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setUserAvatar(uri);
          await saveAvatarToStorage(uri);
        }
      }
    } catch (err) {
      Alert.alert('שגיאה', 'שגיאה בבחירת תמונה');
    }
    setShowPhotoModal(false);
  };

  const saveAvatarToStorage = async (uri: string | null) => {
    try {
      const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = saved ? JSON.parse(saved) : {};
      if (uri) {
        profile.avatar = uri;
      } else {
        delete profile.avatar;
      }
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save avatar:', err);
    }
  };

  const handleRemovePhoto = async () => {
    setUserAvatar(null);
    await saveAvatarToStorage(null);
    setShowPhotoModal(false);
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      const existingProfile = saved ? JSON.parse(saved) : {};
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          ...existingProfile,
          name: userName,
          email: userEmail,
          phone: userPhone,
        })
      );
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const settingsItems = [
    {
      icon: 'language' as const,
      label: 'שפה',
      value: 'עברית',
    },
    {
      icon: 'payment' as const,
      label: 'מטבע ברירת מחדל',
      value: `${currencySymbols[globalCurrency]} ${globalCurrency}`,
    },
    {
      icon: 'notifications' as const,
      label: 'התראות',
      value: 'פעיל',
    },
    {
      icon: 'dark-mode' as const,
      label: 'מצב כהה',
      value: 'כבוי',
    },
  ];

  const quickLinks = [
    {
      icon: 'help' as const,
      label: 'עזרה ותמיכה',
      onPress: () => Alert.alert('עזרה ותמיכה'),
    },
    {
      icon: 'privacy-tip' as const,
      label: 'פרטיות ואבטחה',
      onPress: () => Alert.alert('פרטיות'),
    },
    {
      icon: 'description' as const,
      label: 'תנאי שימוש',
      onPress: () => Alert.alert('תנאי שימוש'),
    },
    {
      icon: 'info' as const,
      label: 'אודות האפליקציה',
      onPress: () => Alert.alert('SASOMM v1.0', 'ניהול פיננסי חכם'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Photo Selection Modal */}
      <Modal visible={showPhotoModal} transparent animationType="slide">
        <Pressable
          style={styles.photoModalOverlay}
          onPress={() => setShowPhotoModal(false)}
        >
          <DarkCard style={styles.photoModalCard}>
            <Text style={styles.photoModalTitle}>{'בחר תמונת פרופיל'}</Text>

            <TouchableOpacity
              style={styles.photoModalItem}
              onPress={() => handlePickImage(true)}
            >
              <View style={styles.photoModalIcon}>
                <MaterialIcons name="photo-camera" size={22} color={colors.primary} />
              </View>
              <Text style={styles.photoModalItemText}>{'צלם תמונה'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoModalItem}
              onPress={() => handlePickImage(false)}
            >
              <View style={styles.photoModalIcon}>
                <MaterialIcons name="photo-library" size={22} color={colors.primary} />
              </View>
              <Text style={styles.photoModalItemText}>{'בחר מהגלריה'}</Text>
            </TouchableOpacity>

            {userAvatar && (
              <TouchableOpacity
                style={styles.photoModalItem}
                onPress={handleRemovePhoto}
              >
                <View style={styles.photoModalIcon}>
                  <MaterialIcons name="delete" size={22} color={colors.error} />
                </View>
                <Text style={[styles.photoModalItemText, { color: colors.error }]}>
                  {'הסר תמונה'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.photoModalCancel}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.photoModalCancelText}>{'ביטול'}</Text>
            </TouchableOpacity>
          </DarkCard>
        </Pressable>
      </Modal>

      {/* Header with gradient + centered avatar */}
      <GradientHeader style={styles.headerContainer}>
        <ScreenTopBar title={'איזור אישי'} onBack={goBack} />
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => setShowPhotoModal(true)} style={styles.avatarTouchable}>
            <AvatarCircle
              name={userName}
              size={100}
              imageUri={userAvatar ?? undefined}
            />
            <View style={styles.avatarCameraBadge}>
              <MaterialIcons name="photo-camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          {!isEditing && (
            <>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <Text style={styles.profilePhone}>{userPhone}</Text>
            </>
          )}
        </View>
      </GradientHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info / Edit Form */}
        <GlassCard style={styles.infoCard}>
          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={userName}
                onChangeText={setUserName}
                placeholder={'שם מלא'}
                placeholderTextColor={colors.textTertiary}
                textAlign="center"
              />
              <TextInput
                style={styles.editInput}
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder={'אימייל'}
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                textAlign="center"
              />
              <TextInput
                style={styles.editInput}
                value={userPhone}
                onChangeText={setUserPhone}
                placeholder={'טלפון'}
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                textAlign="center"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{'שמור שינויים'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileDetails}>
              <View style={styles.profileRow}>
                <MaterialIcons name="person" size={18} color={colors.primary} />
                <Text style={styles.profileDetailLabel}>{'שם'}</Text>
                <Text style={styles.profileDetailValue}>{userName}</Text>
              </View>
              <View style={[styles.profileRow, styles.profileRowBorder]}>
                <MaterialIcons name="email" size={18} color={colors.primary} />
                <Text style={styles.profileDetailLabel}>{'אימייל'}</Text>
                <Text style={styles.profileDetailValue}>{userEmail}</Text>
              </View>
              <View style={[styles.profileRow, styles.profileRowBorder]}>
                <MaterialIcons name="phone" size={18} color={colors.primary} />
                <Text style={styles.profileDetailLabel}>{'טלפון'}</Text>
                <Text style={styles.profileDetailValue}>{userPhone}</Text>
              </View>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={16} color={colors.primary} />
                <Text style={styles.editProfileText}>{'עריכת פרופיל'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Settings Section */}
        <DarkCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{'הגדרות'}</Text>
          </View>
          {settingsItems.map((item, i) => (
            <View
              key={i}
              style={[
                styles.sectionItem,
                i < settingsItems.length - 1 && styles.sectionItemBorder,
              ]}
            >
              <View style={styles.sectionItemLeft}>
                <MaterialIcons name={item.icon} size={20} color={colors.primary} />
                <Text style={styles.sectionItemLabel}>{item.label}</Text>
              </View>
              <Text style={styles.sectionItemValue}>{item.value}</Text>
            </View>
          ))}
        </DarkCard>

        {/* Quick Links */}
        <DarkCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{'קישורים מהירים'}</Text>
          </View>
          {quickLinks.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.sectionItem,
                i < quickLinks.length - 1 && styles.sectionItemBorder,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.sectionItemLeft}>
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.sectionItemLabel}>{item.label}</Text>
              </View>
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </DarkCard>

        {/* Future Feature Placeholders */}
        <View style={styles.placeholderRow}>
          <DarkCard style={styles.placeholderCard}>
            <MaterialIcons name="lock" size={22} color={colors.textTertiary} />
            <Text style={styles.placeholderLabel}>{'אבטחה'}</Text>
            <Text style={styles.placeholderSoon}>{'בקרוב'}</Text>
          </DarkCard>
          <DarkCard style={styles.placeholderCard}>
            <MaterialIcons name="backup" size={22} color={colors.textTertiary} />
            <Text style={styles.placeholderLabel}>{'גיבוי'}</Text>
            <Text style={styles.placeholderSoon}>{'בקרוב'}</Text>
          </DarkCard>
          <DarkCard style={styles.placeholderCard}>
            <MaterialIcons name="cloud-sync" size={22} color={colors.textTertiary} />
            <Text style={styles.placeholderLabel}>{'סנכרון'}</Text>
            <Text style={styles.placeholderSoon}>{'בקרוב'}</Text>
          </DarkCard>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            const ok = await confirmDialog({
              title: 'התנתקות',
              message: 'האם אתה בטוח שברצונך להתנתק?',
              confirmText: 'התנתק',
              destructive: true,
            });
            if (ok) {
              Alert.alert('התנתקת בהצלחה');
              goBack();
            }
          }}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{'התנתקות'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Header / avatar hero
  headerContainer: {
    paddingBottom: spacing['2xl'],
  },
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgPrimary,
  },
  profileName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 120,
    gap: 16,
  },

  // Info card
  infoCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  profileDetails: {
    paddingVertical: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  profileRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
  },
  profileDetailLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    flex: 1,
    writingDirection: 'rtl',
  },
  profileDetailValue: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  editProfileText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Edit form
  editForm: {
    gap: 12,
    padding: spacing.xl,
  },
  editInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.bgPrimary,
    writingDirection: 'rtl',
  },

  // Section cards
  sectionCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 15,
  },
  sectionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionItemLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  sectionItemValue: {
    fontSize: 13,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  // Placeholder future features
  placeholderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  placeholderCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: radii.lg,
    gap: 6,
  },
  placeholderLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  placeholderSoon: {
    fontSize: 10,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,77,106,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,106,0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.error,
    writingDirection: 'rtl',
  },

  // Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  photoModalCard: {
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  photoModalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  photoModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtleBorder,
  },
  photoModalIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalItemText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  photoModalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  photoModalCancelText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
});

export default PersonalArea;
