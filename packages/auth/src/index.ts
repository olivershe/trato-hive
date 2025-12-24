/**
 * @trato-hive/auth
 *
 * Authentication and authorization utilities
 * Layer 6: Governance
 */

// NextAuth instance and handlers
export { auth, signIn, signOut, handlers } from './auth';
export { authConfig } from './auth.config';

// Type extensions
export type * from './types';

// Auth utilities (RBAC, session checks)
export * from './utils';
