import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkEnabled } from './lib/clerk';

/**
 * No route protection here — pages gate content client-side and the (external) API verifies
 * session JWTs itself. The middleware only keeps Clerk's session cookie fresh, and is a
 * no-op when Clerk isn't configured.
 */
export default clerkEnabled ? clerkMiddleware() : (): NextResponse => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and static assets.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
