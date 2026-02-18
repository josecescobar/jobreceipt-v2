import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors, createTypography, spacing } from '../../src/theme';
import { LoadingScreen, Button } from '../../src/components/ui';
import { useBootstrap } from '../../src/hooks/useBootstrap';
import { useAuthStore } from '../../src/stores/auth.store';
import { useOverBudgetCount } from '../../src/hooks/useOverBudgetCount';

function BadgedIcon({ name, size, color, badge, badgeStyles }: { name: React.ComponentProps<typeof Ionicons>['name']; size: number; color: string; badge: number; badgeStyles: ReturnType<typeof createStyles> }) {
  return (
    <View style={{ width: size + 8, height: size + 4, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size} color={color} />
      {badge > 0 && (
        <View style={badgeStyles.badge}>
          <Text style={badgeStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isBootstrapped, isLoading, error, retry } = useBootstrap();
  const { hasOnboarded, onboardingChecked, checkOnboarded } = useAuthStore();
  const overBudgetCount = useOverBudgetCount();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const typography = useMemo(() => createTypography(colors), [colors]);

  useEffect(() => {
    checkOnboarded();
  }, []);

  if (!isLoaded || isLoading || !onboardingChecked) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button title="Try Again" onPress={retry} />
      </View>
    );
  }
  if (!isBootstrapped) return <LoadingScreen />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Receipts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <BadgedIcon name="briefcase" size={size} color={color} badge={overBudgetCount} badgeStyles={styles} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mileage"
        options={{
          title: 'Mileage',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
});
