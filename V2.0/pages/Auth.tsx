// Auth screen — V2.0 Liquid Glass redesign.
// Functionality unchanged from v1: signIn, signUp, signInWithGoogle, web autofill,
// legal links, language picker, error/success states.
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@monn/shared';
import { LanguagePicker } from '../components/ui/LanguagePicker';
import {
  GlassGlowCard,
  GlowButton,
  GoogleSignInButton,
} from '../components/glass';
import { colors, fonts, radii, spacing, gradients } from '../theme';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Light scroll animation — logo fades + scales subtly when user scrolls down
  const scrollY = useRef(new Animated.Value(0)).current;
  const logoScale = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.82], extrapolate: 'clamp' });
  const logoOpacity = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.45], extrapolate: 'clamp' });
  const taglineOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0], extrapolate: 'clamp' });

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');

    // Web autofill fallback — read DOM values if state didn't sync
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

    if (!currentEmail || !currentPassword) { setError('נא למלא את כל השדות'); return; }
    if (!isLogin && !fullName.trim()) { setError('נא להזין שם מלא'); return; }
    if (!isLogin && currentPassword !== confirmPassword) { setError('הסיסמאות אינן תואמות'); return; }
    if (currentPassword.length < 6) { setError('הסיסמא חייבת להכיל לפחות 6 תווים'); return; }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(currentEmail, currentPassword);
        if (error) {
          if (error.message.includes('Invalid login credentials')) setError('אימייל או סיסמא שגויים');
          else setError(error.message);
        }
      } else {
        const { error } = await signUp(currentEmail, currentPassword, {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        });
        if (error) {
          if (error.message.includes('already registered')) setError('משתמש עם אימייל זה כבר קיים');
          else setError(error.message);
        } else {
          setSuccessMessage('נרשמת בהצלחה! אנא אשר את האימייל שלך.');
          setIsLogin(true);
        }
      }
    } catch {
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
      if (error) setError(error.message || 'שגיאה בהתחברות עם Google');
    } catch {
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

  // Render a single input field with Liquid Glass styling + focus glow
  const renderInput = (props: {
    label: string;
    field: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    secure?: boolean;
    keyboard?: 'default' | 'email-address' | 'phone-pad';
    textAlign?: 'left' | 'right';
    inputRef?: React.RefObject<TextInput>;
  }) => {
    const focused = focusedField === props.field;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{props.label}</Text>
        <TextInput
          ref={props.inputRef}
          style={[styles.input, focused && styles.inputFocused]}
          value={props.value}
          onChangeText={props.onChange}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={props.secure}
          keyboardType={props.keyboard ?? 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign={props.textAlign ?? 'right'}
          onFocus={() => setFocusedField(props.field)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Ambient background gradients */}
      <LinearGradient
        colors={['rgba(0,217,217,0.08)', 'transparent', 'rgba(185,103,255,0.08)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO + TAGLINE */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoWrap,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <Image
                source={require('../assets/logo-sasomm.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
              ניהול תקציב פרויקטים
            </Animated.Text>
          </View>

          {/* AUTH CARD with gradient glow border */}
          <GlassGlowCard style={styles.card}>
            {/* Segmented control — Login / Signup */}
            <View style={styles.segmented}>
              <Pressable
                style={[styles.segment, isLogin && styles.segmentActive]}
                onPress={() => !isLogin && toggleMode()}
              >
                <Text style={[styles.segmentText, isLogin && styles.segmentTextActive]}>התחברות</Text>
              </Pressable>
              <Pressable
                style={[styles.segment, !isLogin && styles.segmentActive]}
                onPress={() => isLogin && toggleMode()}
              >
                <Text style={[styles.segmentText, !isLogin && styles.segmentTextActive]}>הרשמה</Text>
              </Pressable>
            </View>

            {/* Signup-only fields */}
            {!isLogin && (
              <>
                {renderInput({
                  label: 'שם מלא *',
                  field: 'fullName',
                  value: fullName,
                  onChange: setFullName,
                  placeholder: 'שם פרטי ומשפחה',
                })}
                {renderInput({
                  label: 'טלפון (אופציונלי)',
                  field: 'phone',
                  value: phone,
                  onChange: setPhone,
                  placeholder: '050-0000000',
                  keyboard: 'phone-pad',
                  textAlign: 'left',
                })}
              </>
            )}

            {/* Email + password */}
            {renderInput({
              label: 'אימייל',
              field: 'email',
              value: email,
              onChange: setEmail,
              placeholder: 'your@email.com',
              keyboard: 'email-address',
              textAlign: 'left',
              inputRef: emailRef,
            })}
            {renderInput({
              label: 'סיסמא',
              field: 'password',
              value: password,
              onChange: setPassword,
              placeholder: '••••••••',
              secure: true,
              textAlign: 'left',
              inputRef: passwordRef,
            })}
            {!isLogin &&
              renderInput({
                label: 'אימות סיסמא',
                field: 'confirmPassword',
                value: confirmPassword,
                onChange: setConfirmPassword,
                placeholder: '••••••••',
                secure: true,
                textAlign: 'left',
              })}

            {/* Error / Success */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Submit button — gradient glow */}
            {loading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color={colors.bgPrimary} />
                <Text style={styles.loadingText}>מעבד...</Text>
              </View>
            ) : (
              <GlowButton
                label={isLogin ? 'התחבר' : 'הירשם'}
                onPress={handleSubmit}
                disabled={loading}
                style={{ marginTop: spacing.sm }}
              />
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>או באמצעות</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google sign-in */}
            <GoogleSignInButton onPress={handleGoogleSignIn} />

            {/* Apple — placeholder */}
            <Pressable
              style={styles.appleButton}
              onPress={() => Alert.alert('בקרוב', 'התחברות עם Apple תתווסף בקרוב')}
            >
              <MaterialIcons name="apple" size={20} color={colors.textPrimary} />
              <Text style={styles.appleText}>המשך עם Apple</Text>
            </Pressable>

            {/* Toggle */}
            <Pressable style={styles.toggleButton} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isLogin ? 'אין לך חשבון? הירשם' : 'יש לך חשבון? התחבר'}
              </Text>
            </Pressable>

            {/* Legal */}
            <Text style={styles.consentText}>
              {isLogin ? 'המשך השימוש מהווה הסכמה ל' : 'בהרשמה אני מסכים ל'}
              <Text style={styles.consentLink} onPress={() => openLegal(TERMS_URL)}>תנאי השימוש</Text>
              {' ול'}
              <Text style={styles.consentLink} onPress={() => openLegal(PRIVACY_URL)}>מדיניות הפרטיות</Text>
              {'.'}
            </Text>
          </GlassGlowCard>

          {/* Language picker */}
          <View style={styles.languageWrap}>
            <LanguagePicker variant="inline" />
          </View>

          <Text style={styles.footer}>© 2026 SASOMM. כל הזכויות שמורות.</Text>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },

  /* Logo */
  logoSection: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoWrap: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#00D9D9', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24 },
      android: { elevation: 18 },
      web: { filter: 'drop-shadow(0 0 24px rgba(0,217,217,0.4)) drop-shadow(0 0 8px rgba(185,103,255,0.25))' } as any,
    }),
  },
  logoImage: { width: 120, height: 120 },
  tagline: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Card */
  card: { padding: spacing['3xl'] },

  /* Segmented control */
  segmented: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  segment: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm },
  segmentActive: {
    backgroundColor: 'rgba(0,217,217,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,217,0.4)',
    ...Platform.select({
      web: { boxShadow: '0 0 14px rgba(0,217,217,0.25)' } as any,
      ios: { shadowColor: '#00D9D9', shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  segmentText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.textTertiary, writingDirection: 'rtl' },
  segmentTextActive: { color: colors.primary, fontFamily: fonts.bold, fontWeight: '700' },

  /* Inputs */
  inputGroup: { marginBottom: spacing.lg },
  label: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    ...Platform.select({
      web: { boxShadow: '0 0 0 3px rgba(0,217,217,0.15)' } as any,
      ios: { shadowColor: '#00D9D9', shadowOpacity: 0.4, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },

  /* Error / Success */
  errorBox: {
    backgroundColor: 'rgba(255,107,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,122,0.3)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontFamily: fonts.regular, color: colors.error, fontSize: 13, textAlign: 'center', writingDirection: 'rtl' },
  successBox: {
    backgroundColor: 'rgba(16,229,164,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,229,164,0.3)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: { fontFamily: fonts.regular, color: colors.success, fontSize: 13, textAlign: 'center', writingDirection: 'rtl' },

  /* Loading state for submit button */
  loadingButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    marginTop: spacing.sm,
    opacity: 0.7,
  },
  loadingText: { color: colors.bgPrimary, fontFamily: fonts.bold, fontSize: 14 },

  /* Divider */
  dividerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginVertical: spacing['2xl'], gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  dividerText: { fontSize: 11, fontFamily: fonts.semibold, color: colors.textTertiary, letterSpacing: 0.5 },

  /* Apple button */
  appleButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.lg,
    marginTop: spacing.md,
  },
  appleText: { color: colors.textPrimary, fontFamily: fonts.bold, fontWeight: '700', fontSize: 14 },

  /* Toggle */
  toggleButton: { marginTop: spacing.xl, alignItems: 'center' },
  toggleText: { color: colors.primary, fontSize: 13, fontFamily: fonts.semibold, writingDirection: 'rtl' },

  /* Legal */
  consentText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  consentLink: { color: colors.primary, fontFamily: fonts.semibold, textDecorationLine: 'underline' },

  /* Language picker + footer */
  languageWrap: { marginTop: spacing.xl, alignItems: 'center' },
  footer: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: spacing['2xl'],
  },
});
