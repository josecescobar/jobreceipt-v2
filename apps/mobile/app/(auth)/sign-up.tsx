import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout';
import { Button, Input } from '../../src/components/ui';
import { useTheme, type ThemeColors, createTypography, spacing } from '../../src/theme';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
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
        setError('Sign up failed. Please try again.');
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
          <Text style={[styles.title, typography.h1]}>Create Account</Text>
          <Text style={[styles.subtitle, typography.bodySmall]}>Start tracking your job costs</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="John Smith"
            autoCapitalize="words"
          />
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
            placeholder="Min 8 characters"
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            disabled={!email || !password || !name}
          />
        </View>

        <Button
          title="Already have an account? Sign In"
          onPress={() => router.push('/(auth)/sign-in')}
          variant="ghost"
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
});
