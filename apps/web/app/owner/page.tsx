'use client';

import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from '@clerk/nextjs';
import { clerkEnabled } from '../../lib/clerk';
import { OwnerDashboard } from './owner-dashboard';

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
        <h1 className="large-title">Your garage</h1>
        <p className="subtle" style={{ marginBottom: 20 }}>
          Sign in to register as an owner and manage your cars.
        </p>
        <SignInButton mode="modal">
          <button className="btn btn-block">Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 44 }}>
          <UserButton />
        </div>
        <OwnerDashboard
          mode="clerk"
          getToken={getToken}
          prefill={{
            fullName: user?.fullName ?? undefined,
            email: user?.primaryEmailAddress?.emailAddress ?? undefined,
          }}
        />
      </SignedIn>
    </>
  );
}
