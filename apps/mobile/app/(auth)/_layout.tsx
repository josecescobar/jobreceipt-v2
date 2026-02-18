import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTheme } from '../../src/theme';
import { LoadingScreen } from '../../src/components/ui';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;
  if (isSignedIn) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
