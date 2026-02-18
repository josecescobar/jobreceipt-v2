import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDED_KEY = '@jobreceipt:onboarded';

interface AuthState {
  userId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  userRole: string | null;
  hasOnboarded: boolean;
  onboardingChecked: boolean;
  setUserId: (userId: string | null) => void;
  setOrganization: (orgId: string | null, orgName?: string | null) => void;
  setUserRole: (role: string | null) => void;
  setOnboarded: () => void;
  checkOnboarded: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  organizationId: null,
  organizationName: null,
  userRole: null,
  hasOnboarded: false,
  onboardingChecked: false,
  setUserId: (userId) => set({ userId }),
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
  reset: () => set({ userId: null, organizationId: null, organizationName: null, userRole: null }),
}));
