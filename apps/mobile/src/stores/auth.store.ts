import { create } from 'zustand';

interface AuthState {
  organizationId: string | null;
  userRole: string | null;
  setOrganization: (orgId: string | null) => void;
  setUserRole: (role: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  organizationId: null,
  userRole: null,
  setOrganization: (orgId) => set({ organizationId: orgId }),
  setUserRole: (role) => set({ userRole: role }),
  reset: () => set({ organizationId: null, userRole: null }),
}));
