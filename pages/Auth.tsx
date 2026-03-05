import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@monn/shared';
import { colors, neuRaised, neuPressed, radii, spacing } from '../theme';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('\u05E0\u05D0 \u05DC\u05DE\u05DC\u05D0 \u05D0\u05EA \u05DB\u05DC \u05D4\u05E9\u05D3\u05D5\u05EA');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('\u05D4\u05E1\u05D9\u05E1\u05DE\u05D0\u05D5\u05EA \u05D0\u05D9\u05E0\u05DF \u05EA\u05D5\u05D0\u05DE\u05D5\u05EA');
      return;
    }

    if (password.length < 6) {
      setError('\u05D4\u05E1\u05D9\u05E1\u05DE\u05D0 \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05DB\u05D9\u05DC \u05DC\u05E4\u05D7\u05D5\u05EA 6 \u05EA\u05D5\u05D5\u05D9\u05DD');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05D0\u05D5 \u05E1\u05D9\u05E1\u05DE\u05D0 \u05E9\u05D2\u05D5\u05D9\u05D9\u05DD');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('\u05DE\u05E9\u05EA\u05DE\u05E9 \u05E2\u05DD \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05D6\u05D4 \u05DB\u05D1\u05E8 \u05E7\u05D9\u05D9\u05DD');
          } else {
            setError(error.message);
          }
        } else {
          setSuccessMessage('\u05E0\u05E8\u05E9\u05DE\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4! \u05D0\u05E0\u05D0 \u05D0\u05E9\u05E8 \u05D0\u05EA \u05D4\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError('\u05D0\u05D9\u05E8\u05E2\u05D4 \u05E9\u05D2\u05D9\u05D0\u05D4, \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Header */}
        <View style={styles.logoSection}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="account-balance-wallet" size={28} color={colors.white} />
            </View>
            <Text style={styles.logoText}>MONNY</Text>
          </View>
          <Text style={styles.subtitle}>{'\u05E0\u05D9\u05D4\u05D5\u05DC \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9 \u05D7\u05DB\u05DD'}</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, neuRaised]}>
          <Text style={styles.cardTitle}>
            {isLogin ? '\u05D4\u05EA\u05D7\u05D1\u05E8\u05D5\u05EA' : '\u05D4\u05E8\u05E9\u05DE\u05D4'}
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{'\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC'}</Text>
            <View style={[styles.inputWrapper, neuPressed]}>
              <TextInput
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
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{'\u05E1\u05D9\u05E1\u05DE\u05D0'}</Text>
            <View style={[styles.inputWrapper, neuPressed]}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                textAlign="left"
              />
            </View>
          </View>

          {/* Confirm Password (signup only) */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{'\u05D0\u05D9\u05DE\u05D5\u05EA \u05E1\u05D9\u05E1\u05DE\u05D0'}</Text>
              <View style={[styles.inputWrapper, neuPressed]}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  textAlign="left"
                />
              </View>
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
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.submitButtonText}>{'\u05DE\u05E2\u05D1\u05D3...'}</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <MaterialIcons
                  name={isLogin ? 'login' : 'person-add'}
                  size={22}
                  color={colors.white}
                />
                <Text style={styles.submitButtonText}>
                  {isLogin ? '\u05D4\u05EA\u05D7\u05D1\u05E8' : '\u05D4\u05D9\u05E8\u05E9\u05DD'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleText}>
              {isLogin
                ? '\u05D0\u05D9\u05DF \u05DC\u05DA \u05D7\u05E9\u05D1\u05D5\u05DF? \u05D4\u05D9\u05E8\u05E9\u05DD'
                : '\u05D9\u05E9 \u05DC\u05DA \u05D7\u05E9\u05D1\u05D5\u05DF? \u05D4\u05EA\u05D7\u05D1\u05E8'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {'\u00A9 2026 MONNY. \u05DB\u05DC \u05D4\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05E9\u05DE\u05D5\u05E8\u05D5\u05EA.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },

  /* Card */
  card: {
    backgroundColor: colors.neuBg,
    borderRadius: radii['3xl'],
    padding: spacing['3xl'],
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    writingDirection: 'rtl',
  },

  /* Inputs */
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputWrapper: {
    borderRadius: radii.lg,
    padding: 4,
    backgroundColor: colors.neuBg,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },

  /* Error / Success */
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Submit Button */
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
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
    fontWeight: '500',
    writingDirection: 'rtl',
  },

  /* Footer */
  footer: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: spacing['2xl'],
  },
});
