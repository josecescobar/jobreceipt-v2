import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { authApi } from '../api/auth';

type ThemeMode = 'light' | 'dark' | 'system';

export interface NotificationPrefs {
  receiptProcessed: boolean;
  budgetAlerts: boolean;
  expenseApproval: boolean;
  reviewReminders: boolean;
  recurringExpenses: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  receiptProcessed: true,
  budgetAlerts: true,
  expenseApproval: true,
  reviewReminders: true,
  recurringExpenses: true,
};

interface SettingsState {
  mileageRateCents: number;
  notifications: NotificationPrefs;
  defaultTaxRate: number;
  defaultExpenseCategory: string | null;
  themeMode: ThemeMode;

  setMileageRateCents: (rate: number) => void;
  setNotificationPref: (key: keyof NotificationPrefs, enabled: boolean) => void;
  setAllNotifications: (enabled: boolean) => void;
  resetMileageRate: () => void;
  setDefaultTaxRate: (rate: number) => void;
  setDefaultExpenseCategory: (category: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

function syncPrefsToApi(prefs: NotificationPrefs) {
  authApi.updateNotificationPrefs({ ...prefs }).catch(() => {});
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      mileageRateCents: IRS_MILEAGE_RATE_CENTS,
      notifications: { ...DEFAULT_NOTIFICATION_PREFS },
      defaultTaxRate: 0,
      defaultExpenseCategory: null,
      themeMode: 'dark' as ThemeMode,

      setMileageRateCents: (rate) => set({ mileageRateCents: rate }),
      setNotificationPref: (key, enabled) => {
        const updated = { ...get().notifications, [key]: enabled };
        set({ notifications: updated });
        syncPrefsToApi(updated);
      },
      setAllNotifications: (enabled) => {
        const updated: NotificationPrefs = {
          receiptProcessed: enabled,
          budgetAlerts: enabled,
          expenseApproval: enabled,
          reviewReminders: enabled,
          recurringExpenses: enabled,
        };
        set({ notifications: updated });
        syncPrefsToApi(updated);
      },
      resetMileageRate: () => set({ mileageRateCents: IRS_MILEAGE_RATE_CENTS }),
      setDefaultTaxRate: (rate) => set({ defaultTaxRate: rate }),
      setDefaultExpenseCategory: (category) => set({ defaultExpenseCategory: category }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'jobreceipt-settings',
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version: number) => {
        // Migrate from old notificationsEnabled boolean to granular prefs
        if (persisted && 'notificationsEnabled' in persisted && !('notifications' in persisted)) {
          const enabled = persisted.notificationsEnabled !== false;
          persisted.notifications = {
            receiptProcessed: enabled,
            budgetAlerts: enabled,
            expenseApproval: enabled,
            reviewReminders: enabled,
            recurringExpenses: enabled,
          };
          delete persisted.notificationsEnabled;
        }
        return persisted as SettingsState;
      },
      version: 1,
    },
  ),
);
