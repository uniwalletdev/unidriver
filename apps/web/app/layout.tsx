import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { clerkEnabled, clerkPublishableKey } from '../lib/clerk';

export const metadata: Metadata = {
  title: 'UniDriver',
  description: 'A three-sided mobility marketplace — Owners, Drivers, Riders.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const page = (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          margin: 0,
          background: '#0b1120',
          color: '#e2e8f0',
        }}
      >
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px' }}>{children}</main>
      </body>
    </html>
  );

  return clerkEnabled ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>{page}</ClerkProvider>
  ) : (
    page
  );
}
