/**
 * NextAuth.js v5 Edge-Compatible Configuration
 *
 * This file contains the edge-safe NextAuth configuration (no Prisma imports).
 * Can be used in Edge Runtime environments (middleware, edge routes, etc.).
 *
 * @see https://authjs.dev/guides/upgrade-to-v5
 */
import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible NextAuth configuration
 * No Prisma imports allowed (edge runtime limitation)
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts (Node.js environment)

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    /**
     * Authorization callback for middleware
     * Protects routes based on authentication status
     */
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnDeals = nextUrl.pathname.startsWith('/deals');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');

      // Protected routes require authentication
      if (isOnDashboard || isOnDeals) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      // Redirect logged-in users away from auth pages
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
};
