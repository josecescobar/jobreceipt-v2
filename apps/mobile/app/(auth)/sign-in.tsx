import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useTheme, type ThemeColors, createTypography, spacing } from '../../src/theme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      if (err.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else if (err.message?.includes('Network') || !err.status) {
        setError('No internet connection. Please check your network.');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, typography.h1]}>JobReceipt</Text>
          <Text style={[styles.subtitle, typography.bodySmall]}>Track receipts. Control costs.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            disabled={!email || !password}
          />
        </View>

        <Button
          title="Don't have an account? Sign Up"
          onPress={() => router.push('/(auth)/sign-up')}
          variant="ghost"
          style={styles.signUpButton}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {},
  form: {
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  signUpButton: {
    marginTop: spacing.md,
  },
});
