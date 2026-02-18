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
  marginAlerts: boolean;
  changeOrders: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  receiptProcessed: true,
  budgetAlerts: true,
  expenseApproval: true,
  reviewReminders: true,
  recurringExpenses: true,
  marginAlerts: true,
  changeOrders: true,
};

export interface DashboardSection {
  id: string;
  visible: boolean;
}

const DEFAULT_DASHBOARD_LAYOUT: DashboardSection[] = [
  { id: 'quickActions', visible: true },
  { id: 'templateQuickAdd', visible: true },
  { id: 'syncStatus', visible: true },
  { id: 'statsRow', visible: true },
  { id: 'weeklySpending', visible: true },
  { id: 'unpaidInvoices', visible: true },
  { id: 'cashFlow', visible: true },
  { id: 'todaySchedule', visible: true },
  { id: 'monthlySpending', visible: true },
  { id: 'categoryBreakdown', visible: true },
  { id: 'topJobBudget', visible: true },
  { id: 'recentActivity', visible: true },
  { id: 'timeTracking', visible: true },
  { id: 'estimates', visible: true },
];

interface SettingsState {
  mileageRateCents: number;
  notifications: NotificationPrefs;
  defaultTaxRate: number;
  defaultExpenseCategory: string | null;
  themeMode: ThemeMode;
  dashboardLayout: DashboardSection[];

  setMileageRateCents: (rate: number) => void;
  setNotificationPref: (key: keyof NotificationPrefs, enabled: boolean) => void;
  setAllNotifications: (enabled: boolean) => void;
  resetMileageRate: () => void;
  setDefaultTaxRate: (rate: number) => void;
  setDefaultExpenseCategory: (category: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDashboardLayout: (layout: DashboardSection[]) => void;
  resetDashboardLayout: () => void;
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
      dashboardLayout: [...DEFAULT_DASHBOARD_LAYOUT],

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
          marginAlerts: enabled,
          changeOrders: enabled,
        };
        set({ notifications: updated });
        syncPrefsToApi(updated);
      },
      resetMileageRate: () => set({ mileageRateCents: IRS_MILEAGE_RATE_CENTS }),
      setDefaultTaxRate: (rate) => set({ defaultTaxRate: rate }),
      setDefaultExpenseCategory: (category) => set({ defaultExpenseCategory: category }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      resetDashboardLayout: () => set({ dashboardLayout: [...DEFAULT_DASHBOARD_LAYOUT] }),
    }),
    {
      name: 'jobreceipt-settings',
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version: number) => {
        // v0 → v1: notificationsEnabled boolean → granular prefs object
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
        // v1 → v2: add dashboardLayout + marginAlerts
        if (version < 2) {
          if (!persisted.dashboardLayout) {
            persisted.dashboardLayout = DEFAULT_DASHBOARD_LAYOUT;
          }
          if (persisted.notifications && !('marginAlerts' in persisted.notifications)) {
            persisted.notifications.marginAlerts = true;
          }
        }
        // v2 → v3: add changeOrders pref + timeTracking/estimates dashboard sections
        if (version < 3) {
          if (persisted.notifications && !('changeOrders' in persisted.notifications)) {
            persisted.notifications.changeOrders = true;
          }
          if (persisted.dashboardLayout) {
            const ids = persisted.dashboardLayout.map((s: any) => s.id);
            if (!ids.includes('timeTracking')) {
              persisted.dashboardLayout.push({ id: 'timeTracking', visible: true });
            }
            if (!ids.includes('estimates')) {
              persisted.dashboardLayout.push({ id: 'estimates', visible: true });
            }
          }
        }
        return persisted as SettingsState;
      },
      version: 3,
    },
  ),
);
