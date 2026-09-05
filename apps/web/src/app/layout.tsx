import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobReceipt',
  description: 'Construction expense tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-background text-foreground antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
