/**
 * Clerk is enabled purely by the presence of its publishable key, so the app still runs in
 * Phase 0 dev-token mode (mock API auth) when the key is unset — locally and in CI.
 */
export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const clerkEnabled = Boolean(clerkPublishableKey);
