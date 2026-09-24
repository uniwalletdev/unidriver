import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { clerkEnabled, clerkPublishableKey } from '../lib/clerk';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'UniDriver', template: '%s · UniDriver' },
  description: 'Earn from your idle car. UniDriver only earns a share when your car does.',
  // "Add to Home Screen" on iOS opens full-screen, like a native app.
  appleWebApp: { capable: true, title: 'UniDriver', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the layout extend under the notch / home indicator; safe-area insets pad it back.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f6fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const page = (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="wordmark">
            <span className="wordmark-mark" aria-hidden>
              U
            </span>
            UniDriver
          </Link>
          <Link href="/owner" className="btn btn-sm btn-secondary">
            Owner dashboard
          </Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );

  return clerkEnabled ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>{page}</ClerkProvider>
  ) : (
    page
  );
}
