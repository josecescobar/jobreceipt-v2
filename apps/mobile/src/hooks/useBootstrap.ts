import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth.store';

export function useBootstrap() {
  const { isSignedIn, isLoaded } = useAuth();
  const organizationId = useAuthStore((s) => s.organizationId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || organizationId) return;

    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authApi.bootstrap();
        if (cancelled) return;

        const defaultOrg = res.organizations.find(
          (o) => o.id === res.defaultOrganizationId,
        ) ?? res.organizations[0];

        useAuthStore.getState().setUserId(res.user.id);

        if (defaultOrg) {
          useAuthStore.getState().setOrganization(defaultOrg.id, defaultOrg.name);
          useAuthStore.getState().setUserRole(defaultOrg.role);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to load account');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, organizationId]);

  return {
    isBootstrapped: !!organizationId,
    isLoading,
    error,
    retry: () => {
      useAuthStore.getState().reset();
    },
  };
}
