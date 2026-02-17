import { create } from 'zustand';

interface AuthState {
  organizationId: string | null;
  organizationName: string | null;
  userRole: string | null;
  setOrganization: (orgId: string | null, orgName?: string | null) => void;
  setUserRole: (role: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  organizationId: null,
  organizationName: null,
  userRole: null,
  setOrganization: (orgId, orgName = null) => set({ organizationId: orgId, organizationName: orgName }),
  setUserRole: (role) => set({ userRole: role }),
  reset: () => set({ organizationId: null, organizationName: null, userRole: null }),
}));
