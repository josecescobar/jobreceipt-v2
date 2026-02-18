import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { CLERK_PUBLISHABLE_KEY, QUERY_CACHE_TIME, QUERY_STALE_TIME } from '../src/lib/constants';
import { setTokenGetter } from '../src/api/client';
import { offlineQueue } from '../src/lib/offline-queue';
import { useNotifications } from '../src/hooks/useNotifications';
import { ThemeProvider, useTheme } from '../src/theme';
import { ErrorBoundary, ToastContainer } from '../src/components/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_CACHE_TIME,
      retry: 2,
    },
  },
});

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

function TokenInjector({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    offlineQueue.startListening();
    return () => offlineQueue.stopListening();
  }, []);

  useNotifications();

  return <>{children}</>;
}

function ThemedApp() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
      <ToastContainer />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <TokenInjector>
                <ThemeProvider>
                  <ThemedApp />
                </ThemeProvider>
              </TokenInjector>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
