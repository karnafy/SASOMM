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
import { colors, neuRaised, neuRaisedLg, radii, spacing } from '../theme';

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.headerBtn, neuRaised]}
              onPress={goBack}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={28} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerSubtitle}>
                {'\u05E0\u05D9\u05D4\u05D5\u05DC \u05E7\u05E9\u05E8\u05D9 \u05E2\u05D1\u05D5\u05D3\u05D4'}
              </Text>
              <Text style={styles.headerTitle}>
                {'\u05DB\u05E8\u05D8\u05D9\u05E1 \u05E1\u05E4\u05E7 \u05D7\u05D3\u05E9'}
              </Text>
            </View>

            <View style={styles.headerPlaceholder} />
          </View>
        </View>

        {/* Avatar Section */}
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
                <MaterialIcons name="person-add" size={56} color={colors.textTertiary} />
                <Text style={styles.avatarPlaceholderText}>
                  {'\u05DC\u05D7\u05E5 \u05DC\u05D4\u05E2\u05DC\u05D0\u05D4'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.cameraIconBadge}>
            <MaterialIcons name="add-a-photo" size={22} color={colors.white} />
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
              <MaterialIcons name="badge" size={18} color="rgba(0, 217, 217, 0.3)" />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder={
                  '\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05D0.\u05D0 \u05D0\u05D9\u05E0\u05E1\u05D8\u05DC\u05E6\u05D9\u05D4'
                }
                placeholderTextColor="rgba(148, 163, 184, 0.5)"
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>
          </View>

          {/* Phone Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                {'\u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF \u05DC\u05D6\u05D9\u05D4\u05D5\u05D9'}
              </Text>
              <MaterialIcons
                name="call"
                size={18}
                color="rgba(16, 185, 129, 0.4)"
              />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.textInput, styles.textInputLtr]}
                placeholder="052-1234567"
                placeholderTextColor="rgba(148, 163, 184, 0.5)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="left"
              />
            </View>
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
                        neuRaised,
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
                  style={[styles.categoryChipAdd]}
                  onPress={() => setIsAddingCategory(true)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add" size={16} color={colors.accentDark} />
                  <Text style={styles.categoryChipAddText}>
                    {'\u05D0\u05D7\u05E8'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.newCategoryRow}>
                <TextInput
                  style={styles.newCategoryInput}
                  placeholder={
                    '\u05D4\u05E7\u05DC\u05D3 \u05E9\u05DD \u05EA\u05D7\u05D5\u05DD...'
                  }
                  placeholderTextColor={colors.textTertiary}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  autoFocus
                  textAlign="right"
                />
                <TouchableOpacity
                  style={[styles.newCategoryCancelBtn, neuRaised]}
                  onPress={() => {
                    setIsAddingCategory(false);
                    setNewCategory('');
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <>
              <Text style={styles.saveBtnText}>
                {'\u05DE\u05E2\u05D1\u05D3 \u05DE\u05E2\u05E8\u05DB\u05EA...'}
              </Text>
              <ActivityIndicator size="small" color={colors.white} />
            </>
          ) : (
            <>
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                {'\u05D0\u05E9\u05E8 \u05D5\u05E9\u05DE\u05D5\u05E8 \u05E1\u05E4\u05E7'}
              </Text>
              <MaterialIcons
                name="verified-user"
                size={28}
                color={canSave ? colors.white : colors.textTertiary}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddSupplier;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Header
  header: {
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.neuBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  headerPlaceholder: {
    width: 56,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    position: 'relative',
  },
  avatarUploadWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 6,
    borderColor: colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    writingDirection: 'rtl',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: '50%',
    marginRight: -90,
    width: 52,
    height: 52,
    borderRadius: radii['2xl'],
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },

  // Form
  form: {
    paddingHorizontal: spacing['3xl'],
    gap: spacing['3xl'],
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  fieldLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    writingDirection: 'rtl',
  },
  inputWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    height: 64,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingVertical: 0,
  },
  textInputLtr: {
    writingDirection: 'ltr',
    textAlign: 'left',
    letterSpacing: 2,
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
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    writingDirection: 'rtl',
  },
  categoryChipTextSelected: {
    color: colors.accentDark,
  },
  categoryChipAdd: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryChipAddText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentDark,
    writingDirection: 'rtl',
  },
  newCategoryRow: {
    flexDirection: 'row-reverse',
    gap: spacing.lg,
    alignItems: 'center',
  },
  newCategoryInput: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii['2xl'],
    paddingHorizontal: spacing.xl,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  newCategoryCancelBtn: {
    width: 56,
    height: 56,
    borderRadius: radii['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: colors.neuBg,
  },
  saveBtn: {
    height: 72,
    backgroundColor: colors.primary,
    borderRadius: 32,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    writingDirection: 'rtl',
  },
  saveBtnTextDisabled: {
    color: colors.textTertiary,
  },
});
