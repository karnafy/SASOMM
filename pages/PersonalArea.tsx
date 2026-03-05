import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, Currency } from '@monn/shared';
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

interface PersonalAreaProps {
  onNavigate: (screen: AppScreen) => void;
  goBack: () => void;
  globalCurrency: Currency;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

const PROFILE_STORAGE_KEY = 'user_profile';

const PersonalArea: React.FC<PersonalAreaProps> = ({
  onNavigate,
  goBack,
  globalCurrency,
}) => {
  const [userName, setUserName] = useState('\u05DE\u05E9\u05EA\u05DE\u05E9');
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
          setUserName(profile.name || '\u05DE\u05E9\u05EA\u05DE\u05E9');
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
          Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DC\u05DE\u05E6\u05DC\u05DE\u05D4');
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
          Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05EA \u05D2\u05D9\u05E9\u05D4 \u05DC\u05D2\u05DC\u05E8\u05D9\u05D4');
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
      Alert.alert('\u05E9\u05D2\u05D9\u05D0\u05D4', '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05D1\u05D7\u05D9\u05E8\u05EA \u05EA\u05DE\u05D5\u05E0\u05D4');
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
      label: '\u05E9\u05E4\u05D4',
      value: '\u05E2\u05D1\u05E8\u05D9\u05EA',
    },
    {
      icon: 'payment' as const,
      label: '\u05DE\u05D8\u05D1\u05E2 \u05D1\u05E8\u05D9\u05E8\u05EA \u05DE\u05D7\u05D3\u05DC',
      value: `${currencySymbols[globalCurrency]} ${globalCurrency}`,
    },
    {
      icon: 'notifications' as const,
      label: '\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA',
      value: '\u05E4\u05E2\u05D9\u05DC',
    },
    {
      icon: 'dark-mode' as const,
      label: '\u05DE\u05E6\u05D1 \u05DB\u05D4\u05D4',
      value: '\u05DB\u05D1\u05D5\u05D9',
    },
  ];

  const quickLinks = [
    {
      icon: 'help' as const,
      label: '\u05E2\u05D6\u05E8\u05D4 \u05D5\u05EA\u05DE\u05D9\u05DB\u05D4',
      onPress: () => Alert.alert('\u05E2\u05D6\u05E8\u05D4 \u05D5\u05EA\u05DE\u05D9\u05DB\u05D4'),
    },
    {
      icon: 'privacy-tip' as const,
      label: '\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5\u05D0\u05D1\u05D8\u05D7\u05D4',
      onPress: () => Alert.alert('\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA'),
    },
    {
      icon: 'description' as const,
      label: '\u05EA\u05E0\u05D0\u05D9 \u05E9\u05D9\u05DE\u05D5\u05E9',
      onPress: () => Alert.alert('\u05EA\u05E0\u05D0\u05D9 \u05E9\u05D9\u05DE\u05D5\u05E9'),
    },
    {
      icon: 'info' as const,
      label: '\u05D0\u05D5\u05D3\u05D5\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4',
      onPress: () => Alert.alert('MONNY v1.0', '\u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9 \u05D7\u05DB\u05DD'),
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
          <View style={[styles.photoModalCard, neuRaisedLg]}>
            <Text style={styles.photoModalTitle}>{'\u05D1\u05D7\u05E8 \u05EA\u05DE\u05D5\u05E0\u05EA \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC'}</Text>

            <TouchableOpacity
              style={styles.photoModalItem}
              onPress={() => handlePickImage(true)}
            >
              <View style={styles.photoModalIcon}>
                <MaterialIcons name="photo-camera" size={22} color={colors.primary} />
              </View>
              <Text style={styles.photoModalItemText}>{'\u05E6\u05DC\u05DD \u05EA\u05DE\u05D5\u05E0\u05D4'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoModalItem}
              onPress={() => handlePickImage(false)}
            >
              <View style={styles.photoModalIcon}>
                <MaterialIcons name="photo-library" size={22} color={colors.primary} />
              </View>
              <Text style={styles.photoModalItemText}>{'\u05D1\u05D7\u05E8 \u05DE\u05D4\u05D2\u05DC\u05E8\u05D9\u05D4'}</Text>
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
                  {'\u05D4\u05E1\u05E8 \u05EA\u05DE\u05D5\u05E0\u05D4'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.photoModalCancel}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.photoModalCancelText}>{'\u05D1\u05D9\u05D8\u05D5\u05DC'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerBtn, neuRaised]}
          onPress={() => goBack()}
        >
          <MaterialIcons name="arrow-forward" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'\u05D0\u05D9\u05D6\u05D5\u05E8 \u05D0\u05D9\u05E9\u05D9'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, neuRaisedLg]}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowPhotoModal(true)}
          >
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="person" size={48} color={colors.primary} />
            )}
            <View style={styles.avatarOverlay}>
              <MaterialIcons name="photo-camera" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={userName}
                onChangeText={setUserName}
                placeholder={'\u05E9\u05DD \u05DE\u05DC\u05D0'}
                placeholderTextColor={colors.textTertiary}
                textAlign="center"
              />
              <TextInput
                style={styles.editInput}
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder={'\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC'}
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                textAlign="center"
              />
              <TextInput
                style={styles.editInput}
                value={userPhone}
                onChangeText={setUserPhone}
                placeholder={'\u05D8\u05DC\u05E4\u05D5\u05DF'}
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                textAlign="center"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{'\u05E9\u05DE\u05D5\u05E8 \u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <Text style={styles.profilePhone}>{userPhone}</Text>
              <TouchableOpacity
                style={[styles.editProfileBtn, neuRaised]}
                onPress={() => setIsEditing(true)}
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
                <Text style={styles.editProfileText}>{'\u05E2\u05E8\u05D9\u05DB\u05EA \u05E4\u05E8\u05D5\u05E4\u05D9\u05DC'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Settings Section */}
        <View style={[styles.settingsCard, neuRaised]}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>{'\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA'}</Text>
          </View>
          {settingsItems.map((item, i) => (
            <View
              key={i}
              style={[
                styles.settingsItem,
                i < settingsItems.length - 1 && styles.settingsItemBorder,
              ]}
            >
              <View style={styles.settingsItemLeft}>
                <MaterialIcons name={item.icon} size={22} color={colors.primary} />
                <Text style={styles.settingsItemLabel}>{item.label}</Text>
              </View>
              <Text style={styles.settingsItemValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View style={[styles.settingsCard, neuRaised]}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderText}>{'\u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD \u05DE\u05D4\u05D9\u05E8\u05D9\u05DD'}</Text>
          </View>
          {quickLinks.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.settingsItem,
                i < quickLinks.length - 1 && styles.settingsItemBorder,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.settingsItemLeft}>
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingsItemLabel}>{item.label}</Text>
              </View>
              <MaterialIcons
                name="chevron-left"
                size={22}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, neuRaised]}
          onPress={() => {
            Alert.alert(
              '\u05D4\u05EA\u05E0\u05EA\u05E7\u05D5\u05EA',
              '\u05D4\u05D0\u05DD \u05D0\u05EA\u05D4 \u05D1\u05D8\u05D5\u05D7 \u05E9\u05D1\u05E8\u05E6\u05D5\u05E0\u05DA \u05DC\u05D4\u05EA\u05E0\u05EA\u05E7?',
              [
                { text: '\u05D1\u05D9\u05D8\u05D5\u05DC', style: 'cancel' },
                {
                  text: '\u05D4\u05EA\u05E0\u05EA\u05E7',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('\u05D4\u05EA\u05E0\u05EA\u05E7\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4');
                    goBack();
                  },
                },
              ]
            );
          }}
        >
          <MaterialIcons name="logout" size={22} color={colors.error} />
          <Text style={styles.logoutText}>{'\u05D4\u05EA\u05E0\u05EA\u05E7\u05D5\u05EA'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neuBg,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neuBg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
    gap: 20,
  },

  // Profile
  profileCard: {
    borderRadius: radii['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    backgroundColor: colors.neuBg,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.neuBg,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Edit form
  editForm: {
    width: '100%',
    gap: 12,
  },
  editInput: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
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
    fontWeight: '700',
    color: colors.white,
    writingDirection: 'rtl',
  },

  // Settings
  settingsCard: {
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.neuBg,
  },
  settingsHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingsHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  settingsItemValue: {
    fontSize: 14,
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
    backgroundColor: colors.neuBg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    writingDirection: 'rtl',
  },

  // Photo Modal
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  photoModalCard: {
    backgroundColor: colors.neuBg,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    padding: spacing.xl,
  },
  photoModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  photoModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  photoModalIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalItemText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '600',
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
});

export default PersonalArea;
