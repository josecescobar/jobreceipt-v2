import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  mileageRateCents: number;
  notificationsEnabled: boolean;
  defaultTaxRate: number;
  defaultExpenseCategory: string | null;
  themeMode: ThemeMode;

  setMileageRateCents: (rate: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetMileageRate: () => void;
  setDefaultTaxRate: (rate: number) => void;
  setDefaultExpenseCategory: (category: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      mileageRateCents: IRS_MILEAGE_RATE_CENTS,
      notificationsEnabled: true,
      defaultTaxRate: 0,
      defaultExpenseCategory: null,
      themeMode: 'dark' as ThemeMode,

      setMileageRateCents: (rate) => set({ mileageRateCents: rate }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      resetMileageRate: () => set({ mileageRateCents: IRS_MILEAGE_RATE_CENTS }),
      setDefaultTaxRate: (rate) => set({ defaultTaxRate: rate }),
      setDefaultExpenseCategory: (category) => set({ defaultExpenseCategory: category }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'jobreceipt-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
