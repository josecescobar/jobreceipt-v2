'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <OrganizationSwitcher
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
      />
      <UserButton />
    </header>
  );
}
