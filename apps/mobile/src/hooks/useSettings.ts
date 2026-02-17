import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';

interface SettingsState {
  mileageRateCents: number;
  notificationsEnabled: boolean;

  setMileageRateCents: (rate: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetMileageRate: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      mileageRateCents: IRS_MILEAGE_RATE_CENTS,
      notificationsEnabled: true,

      setMileageRateCents: (rate) => set({ mileageRateCents: rate }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      resetMileageRate: () => set({ mileageRateCents: IRS_MILEAGE_RATE_CENTS }),
    }),
    {
      name: 'jobreceipt-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
