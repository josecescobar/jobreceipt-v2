import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDED_KEY = '@jobreceipt:onboarded';

interface AuthState {
  organizationId: string | null;
  organizationName: string | null;
  userRole: string | null;
  hasOnboarded: boolean;
  onboardingChecked: boolean;
  setOrganization: (orgId: string | null, orgName?: string | null) => void;
  setUserRole: (role: string | null) => void;
  setOnboarded: () => void;
  checkOnboarded: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  organizationId: null,
  organizationName: null,
  userRole: null,
  hasOnboarded: false,
  onboardingChecked: false,
  setOrganization: (orgId, orgName = null) => set({ organizationId: orgId, organizationName: orgName }),
  setUserRole: (role) => set({ userRole: role }),
  setOnboarded: () => {
    SecureStore.setItemAsync(ONBOARDED_KEY, 'true');
    set({ hasOnboarded: true });
  },
  checkOnboarded: async () => {
    const value = await SecureStore.getItemAsync(ONBOARDED_KEY);
    set({ hasOnboarded: value === 'true', onboardingChecked: true });
  },
  reset: () => set({ organizationId: null, organizationName: null, userRole: null }),
}));
