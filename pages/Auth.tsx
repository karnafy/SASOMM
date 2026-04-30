import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@monn/shared';
import { colors, fonts, glowButton, radii, spacing } from '../theme';

const PRIVACY_URL = 'https://sasomm.com/privacy.html';
const TERMS_URL = 'https://sasomm.com/terms.html';

function openLegal(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch(() => undefined);
  }
}

export default function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');

    // On web, browser autofill may not trigger onChangeText.
    // Read DOM values as fallback.
    let currentEmail = email;
    let currentPassword = password;
    if (Platform.OS === 'web') {
      const emailNode = emailRef.current as unknown as HTMLInputElement;
      const passwordNode = passwordRef.current as unknown as HTMLInputElement;
      if (emailNode?.value && !currentEmail) currentEmail = emailNode.value;
      if (passwordNode?.value && !currentPassword) currentPassword = passwordNode.value;
      if (currentEmail !== email) setEmail(currentEmail);
      if (currentPassword !== password) setPassword(currentPassword);
    }

    if (!currentEmail || !currentPassword) {
      setError('נא למלא את כל השדות');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setError('נא להזין שם מלא');
      return;
    }

    if (!isLogin && currentPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (currentPassword.length < 6) {
      setError('הסיסמא חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(currentEmail, currentPassword);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('אימייל או סיסמא שגויים');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(currentEmail, currentPassword, {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        });
        if (error) {
          if (error.message.includes('already registered')) {
            setError('משתמש עם אימייל זה כבר קיים');
          } else {
            setError(error.message);
          }
        } else {
          setSuccessMessage('נרשמת בהצלחה! אנא אשר את האימייל שלך.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError('אירעה שגיאה, נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message || 'שגיאה בהתחברות עם Google');
      }
    } catch (err) {
      setError('שגיאה בהתחברות עם Google');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
  };

  return (
    <LinearGradient
      colors={colors.gradientColors}
      locations={colors.gradientLocations}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View style={styles.logoSection}>
            <Image
              source={require('../assets/logo-sasomm.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{'ניהול פיננסי חכם'}</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Auth Toggle - Segmented Control */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segment, isLogin && styles.segmentActive]}
                onPress={() => !isLogin && toggleMode()}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, isLogin && styles.segmentTextActive]}>
                  {'התחברות'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, !isLogin && styles.segmentActive]}
                onPress={() => isLogin && toggleMode()}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, !isLogin && styles.segmentTextActive]}>
                  {'הרשמה'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name + Phone (signup only) */}
            {!isLogin && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{'שם מלא *'}</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={'שם פרטי ומשפחה'}
                    placeholderTextColor={colors.textTertiary}
                    textAlign="right"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{'טלפון (אופציונלי)'}</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="050-0000000"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    textAlign="left"
                  />
                </View>
              </>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{'אימייל'}</Text>
              <TextInput
                ref={emailRef}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="left"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{'סיסמא'}</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={'\•\•\•\•\•\•\•\•'}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                textAlign="left"
              />
            </View>

            {/* Confirm Password (signup only) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{'אימות סיסמא'}</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={'\•\•\•\•\•\•\•\•'}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  textAlign="left"
                />
              </View>
            )}

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
              style={loading ? styles.submitButtonDisabledWrapper : undefined}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitButton, glowButton]}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color={colors.bgPrimary} />
                    <Text style={styles.submitButtonText}>{'מעבד...'}</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <MaterialIcons
                      name={isLogin ? 'login' : 'person-add'}
                      size={22}
                      color={colors.bgPrimary}
                    />
                    <Text style={styles.submitButtonText}>
                      {isLogin ? 'התחבר' : 'הירשם'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Social Auth Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{'או'}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Auth Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.socialButtonTextG}>G</Text>
                <Text style={styles.socialButtonLabel}>{'Google'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('בקרוב', 'התחברות עם Apple תתווסף בקרוב')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="apple" size={22} color={colors.textSecondary} />
                <Text style={styles.socialButtonLabel}>{'Apple'}</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Link */}
            <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isLogin
                  ? 'אין לך חשבון? הירשם'
                  : 'יש לך חשבון? התחבר'}
              </Text>
            </TouchableOpacity>

            {/* Legal consent — required for App Store, Google Play, GDPR */}
            <Text style={styles.consentText}>
              {isLogin ? 'המשך השימוש מהווה הסכמה ל' : 'בהרשמה אני מסכים ל'}
              <Text style={styles.consentLink} onPress={() => openLegal(TERMS_URL)}>
                {'תנאי השימוש'}
              </Text>
              {' ול'}
              <Text style={styles.consentLink} onPress={() => openLegal(PRIVACY_URL)}>
                {'מדיניות הפרטיות'}
              </Text>
              {'.'}
            </Text>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            {'\© 2026 SASOMM. כל הזכויות שמורות.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },

  /* Logo */
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoImage: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 30,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* Card */
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii['3xl'],
    padding: spacing['3xl'],
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  /* Segmented Control */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: 'rgba(0,217,217,0.12)',
  },
  segmentText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },
  segmentTextActive: {
    color: colors.primary,
  },

  /* Inputs */
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.white,
  },

  /* Error / Success */
  errorBox: {
    backgroundColor: 'rgba(255,77,106,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,106,0.3)',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.regular,
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  successBox: {
    backgroundColor: 'rgba(0,232,143,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,232,143,0.3)',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    fontFamily: fonts.regular,
    color: colors.success,
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Submit Button */
  submitButtonDisabledWrapper: {
    opacity: 0.5,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    color: colors.bgPrimary,
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['2xl'],
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.subtleBorder,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textTertiary,
  },

  /* Social Auth */
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  socialButtonTextG: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  socialButtonLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },

  /* Toggle */
  toggleButton: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.medium,
    writingDirection: 'rtl',
  },

  /* Legal consent (privacy + terms) */
  consentText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  consentLink: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    textDecorationLine: 'underline',
  },

  /* Footer */
  footer: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: spacing['2xl'],
  },
});
