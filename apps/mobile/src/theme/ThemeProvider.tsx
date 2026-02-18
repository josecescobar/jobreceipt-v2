import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { useSettings } from '../hooks/useSettings';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettings((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const { colors, isDark } = useMemo(() => {
    let dark: boolean;
    if (themeMode === 'system') {
      dark = systemScheme !== 'light';
    } else {
      dark = themeMode === 'dark';
    }
    return { colors: dark ? darkColors : lightColors, isDark: dark };
  }, [themeMode, systemScheme]);

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
