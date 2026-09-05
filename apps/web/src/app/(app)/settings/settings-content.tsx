'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { UserProfile, OrganizationInfo } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PLAN_STYLES: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-800',
  PRO: 'bg-blue-100 text-blue-800',
  CREW: 'bg-purple-100 text-purple-800',
};

interface Props {
  profile: UserProfile | null;
  organization: OrganizationInfo | null;
}

export function SettingsContent({ profile, organization }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab profile={profile} />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationTab organization={organization} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({ profile }: { profile: UserProfile | null }) {
  const router = useRouter();
  const api = useApiClient();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSaving(true);
      setMessage(null);

      const form = new FormData(e.currentTarget);

      try {
        await api.patch('/auth/me', {
          name: (form.get('name') as string) || undefined,
          phone: (form.get('phone') as string) || undefined,
        });
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
        router.refresh();
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to update profile',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [api, router],
  );

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Unable to load profile data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your full name"
              defaultValue={profile.name ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed through your authentication provider.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="e.g. (555) 123-4567"
              defaultValue={profile.phone ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={profile.role} disabled className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}

function OrganizationTab({ organization }: { organization: OrganizationInfo | null }) {
  const router = useRouter();
  const api = useApiClient();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!organization) return;
      setIsSaving(true);
      setMessage(null);

      const form = new FormData(e.currentTarget);
      const name = (form.get('orgName') as string)?.trim();
      const slug = (form.get('slug') as string)?.trim();

      if (!name) {
        setMessage({ type: 'error', text: 'Organization name is required.' });
        setIsSaving(false);
        return;
      }

      try {
        await api.patch(`/organizations/${organization.id}`, {
          name,
          slug: slug || undefined,
        });
        setMessage({ type: 'success', text: 'Organization updated successfully.' });
        router.refresh();
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to update organization',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [api, organization, router],
  );

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            No organization found. Create or join one to manage settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const planStyle = PLAN_STYLES[organization.plan] ?? PLAN_STYLES.FREE;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              name="orgName"
              placeholder="e.g. Smith Construction LLC"
              defaultValue={organization.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="e.g. smith-construction"
              defaultValue={organization.slug}
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Plan</Label>
              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${planStyle}`}
                >
                  {organization.plan}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Members</Label>
              <p className="text-sm font-medium">{organization.memberCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">QuickBooks Online</p>
              <p className="text-sm text-muted-foreground">
                Sync expenses and receipts with QuickBooks.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Coming Soon
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get notified about receipt processing, budget alerts, and approvals.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Coming Soon
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">CSV / PDF Export</p>
              <p className="text-sm text-muted-foreground">
                Configure default export formats and date ranges.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Coming Soon
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
