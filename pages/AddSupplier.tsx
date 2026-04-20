import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { AppScreen } from '@monn/shared';
import { colors, fonts, radii, spacing } from '../theme';
import { ScreenTopBar } from '../components/ui/ScreenTopBar';
import { GradientButton } from '../components/ui/GradientButton';

interface AddSupplierProps {
  onNavigate: (screen: AppScreen) => void;
  goBack: () => void;
  onSave: (name: string, category: string, phone: string, avatar?: string) => Promise<void>;
  returnTo?: AppScreen | null;
}

const CATEGORIES = [
  'אינסטלציה',
  'חשמל',
  'בנייה',
  'ריהוט',
  'גינון',
  'כללי',
];

const AddSupplier: React.FC<AddSupplierProps> = ({
  onNavigate,
  goBack,
  onSave,
  returnTo,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('כללי');
  const [phone, setPhone] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    const finalCategory = isAddingCategory ? newCategory : category;
    setIsSaving(true);
    try {
      await onSave(
        name || 'ספק חדש',
        finalCategory || 'כללי',
        phone,
        avatar || `https://picsum.photos/seed/${encodeURIComponent(name || 'default')}/100`
      );
    } catch {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'שגיאה',
        'נדרשת הרשאה לגלריה'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleImportContact = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('', 'ייבוא אנשי קשר זמין רק באפליקציית הנייד');
      return;
    }
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('שגיאה', 'נדרשת הרשאה לאנשי הקשר');
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
    });
    if (!data || data.length === 0) {
      Alert.alert('', 'לא נמצאו אנשי קשר');
      return;
    }
    // Show a simple list via Alert on mobile
    // For a better UX we could use a modal, but Alert with options works for now
    const contact = await new Promise<Contacts.Contact | null>((resolve) => {
      // Use presentContactPickerAsync if available (iOS), otherwise pick first match
      Contacts.presentContactPickerAsync?.()
        .then((c) => resolve(c))
        .catch(() => resolve(null));
    });
    if (contact) {
      setName(contact.name || '');
      const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
      setPhone(phoneNumber);
      if (contact.image?.uri) {
        setAvatar(contact.image.uri);
      }
    }
  };

  const canSave = name.trim().length > 0 && !isSaving;

  return (
    <View style={styles.container}>
      <ScreenTopBar
        title={'כרטיס ספק חדש'}
        onBack={goBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar picker — large circle + camera icon overlay */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarUploadWrap}
            onPress={handlePickImage}
            activeOpacity={0.85}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person-add" size={48} color={colors.textTertiary} />
                <Text style={styles.avatarPlaceholderText}>
                  {'לחץ להעלאה'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.cameraIconBadge}>
            <MaterialIcons name="add-a-photo" size={18} color={colors.bgPrimary} />
          </View>
        </View>

        {/* Import from contacts button */}
        <TouchableOpacity
          style={styles.importContactBtn}
          onPress={handleImportContact}
          activeOpacity={0.8}
        >
          <MaterialIcons name="contact-phone" size={20} color={colors.primary} />
          <Text style={styles.importContactText}>{'ייבוא מאנשי קשר'}</Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                {'שם הספק / העסק *'}
              </Text>
              <MaterialIcons name="badge" size={16} color={colors.textTertiary} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={'לדוגמה: א.א אינסטלציה'}
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>

          {/* Phone Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                {'מספר טלפון לזיהוי'}
              </Text>
              <MaterialIcons name="call" size={16} color={colors.textTertiary} />
            </View>
            <TextInput
              style={[styles.textInput, styles.textInputLtr]}
              placeholder="052-1234567"
              placeholderTextColor={colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="left"
            />
          </View>

          {/* Category Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                {'תחום התמחות עיקרי'}
              </Text>
            </View>

            {!isAddingCategory ? (
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                      ]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.categoryChipAdd}
                  onPress={() => setIsAddingCategory(true)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add" size={14} color={colors.accent} />
                  <Text style={styles.categoryChipAddText}>
                    {'אחר'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.newCategoryRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={'הקלד שם תחום...'}
                  placeholderTextColor={colors.textTertiary}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  autoFocus
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.newCategoryCancelBtn}
                  onPress={() => {
                    setIsAddingCategory(false);
                    setNewCategory('');
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <GradientButton
          label={
            isSaving
              ? 'מעבד מערכת...'
              : 'אשר ושמור ספק'
          }
          onPress={handleSave}
          disabled={!canSave}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
};

export default AddSupplier;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Avatar Section — large circle + camera badge
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing['3xl'],
    position: 'relative',
  },
  avatarUploadWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.bgTertiary,
    borderWidth: 2,
    borderColor: colors.subtleBorder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholderText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: '50%',
    marginRight: -80,
    width: 40,
    height: 40,
    borderRadius: radii['2xl'],
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgPrimary,
  },

  // Import Contact
  importContactBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing['3xl'],
    marginBottom: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary + '66',
    backgroundColor: colors.primary + '0D',
  },
  importContactText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Form
  form: {
    paddingHorizontal: spacing['3xl'],
    gap: spacing['3xl'],
  },
  fieldGroup: {
    gap: spacing.md,
  },
  fieldLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  textInput: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  textInputLtr: {
    writingDirection: 'ltr',
    textAlign: 'left',
    letterSpacing: 1,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  categoryChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.bgTertiary,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  categoryChipTextSelected: {
    color: colors.accent,
  },
  categoryChipAdd: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent + '4D',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryChipAddText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.accent,
    writingDirection: 'rtl',
  },
  newCategoryRow: {
    flexDirection: 'row-reverse',
    gap: spacing.lg,
    alignItems: 'center',
  },
  newCategoryCancelBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer / Save
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.xl,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.subtleBorder,
  },
  saveButton: {
    width: '100%',
  },
});
