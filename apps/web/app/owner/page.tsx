'use client';

import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/nextjs';
import { clerkEnabled } from '../../lib/clerk';
import { button, OwnerDashboard } from './owner-dashboard';

/**
 * With Clerk configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set) the page gates on sign-in and
 * authenticates API calls with Clerk session JWTs. Without it, the Phase 0 dev-token flow runs
 * unchanged — `clerkEnabled` is inlined at build time, so the branch is constant.
 */
export default function OwnerPage() {
  return clerkEnabled ? <ClerkOwnerPage /> : <OwnerDashboard mode="dev" />;
}

function ClerkOwnerPage() {
  const { getToken } = useAuth();
  const { user } = useUser();

  return (
    <>
      <SignedOut>
        <h1 style={{ fontSize: 32 }}>Owner dashboard</h1>
        <p style={{ color: '#94a3b8' }}>Sign in to register as an owner and manage your fleet.</p>
        <SignInButton mode="modal">
          <button style={button}>Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <UserButton />
        </div>
        <OwnerDashboard
          mode="clerk"
          getToken={() => getToken()}
          prefill={{
            fullName: user?.fullName ?? undefined,
            email: user?.primaryEmailAddress?.emailAddress ?? undefined,
          }}
        />
      </SignedIn>
    </>
  );
}
