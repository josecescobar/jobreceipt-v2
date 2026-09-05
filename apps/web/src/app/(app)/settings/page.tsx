import { getServerApiClient } from '@/lib/api/server';
import type { UserProfile, OrganizationInfo } from '@/lib/api/types';
import { SettingsContent } from './settings-content';

export default async function SettingsPage() {
  const api = await getServerApiClient();

  const [profile, org] = await Promise.all([
    api.get<UserProfile>('/auth/me').catch(() => null),
    api.get<OrganizationInfo>('/organizations/current').catch(() => null),
  ]);

  return <SettingsContent profile={profile} organization={org} />;
}
