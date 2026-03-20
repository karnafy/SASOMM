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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  '\u05D0\u05D9\u05E0\u05E1\u05D8\u05DC\u05E6\u05D9\u05D4',
  '\u05D7\u05E9\u05DE\u05DC',
  '\u05D1\u05E0\u05D9\u05D9\u05D4',
  '\u05E8\u05D9\u05D4\u05D5\u05D8',
  '\u05D2\u05D9\u05E0\u05D5\u05DF',
  '\u05DB\u05DC\u05DC\u05D9',
];

const AddSupplier: React.FC<AddSupplierProps> = ({
  onNavigate,
  goBack,
  onSave,
  returnTo,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('\u05DB\u05DC\u05DC\u05D9');
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
        name || '\u05E1\u05E4\u05E7 \u05D7\u05D3\u05E9',
        finalCategory || '\u05DB\u05DC\u05DC\u05D9',
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
        '\u05E9\u05D2\u05D9\u05D0\u05D4',
        '\u05E0\u05D3\u05E8\u05E9\u05EA \u05D4\u05E8\u05E9\u05D0\u05D4 \u05DC\u05D2\u05DC\u05E8\u05D9\u05D4'
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

  const canSave = name.trim().length > 0 && !isSaving;

  return (
    <View style={styles.container}>
      <ScreenTopBar
        title={'\u05DB\u05E8\u05D8\u05D9\u05E1 \u05E1\u05E4\u05E7 \u05D7\u05D3\u05E9'}
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
                  {'\u05DC\u05D7\u05E5 \u05DC\u05D4\u05E2\u05DC\u05D0\u05D4'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.cameraIconBadge}>
            <MaterialIcons name="add-a-photo" size={18} color={colors.bgPrimary} />
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                {'\u05E9\u05DD \u05D4\u05E1\u05E4\u05E7 / \u05D4\u05E2\u05E1\u05E7 *'}
              </Text>
              <MaterialIcons name="badge" size={16} color={colors.textTertiary} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={'\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05D0.\u05D0 \u05D0\u05D9\u05E0\u05E1\u05D8\u05DC\u05E6\u05D9\u05D4'}
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
                {'\u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05D6\u05D9\u05D4\u05D5\u05D9'}
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
                {'\u05EA\u05D7\u05D5\u05DD \u05D4\u05EA\u05DE\u05D7\u05D5\u05EA \u05E2\u05D9\u05E7\u05E8\u05D9'}
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
                    {'\u05D0\u05D7\u05E8'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.newCategoryRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={'\u05D4\u05E7\u05DC\u05D3 \u05E9\u05DD \u05EA\u05D7\u05D5\u05DD...'}
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
              ? '\u05DE\u05E2\u05D1\u05D3 \u05DE\u05E2\u05E8\u05DB\u05EA...'
              : '\u05D0\u05E9\u05E8 \u05D5\u05E9\u05DE\u05D5\u05E8 \u05E1\u05E4\u05E7'
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
