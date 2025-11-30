# Authentication & Authorization Package (packages/auth)

Parent: Root CLAUDE.md

## 1. Purpose

Centralized authentication and authorization for Trato Hive using NextAuth 5 with Prisma adapter. Provides session management, OAuth/SAML providers, RBAC utilities, and tRPC middleware for securing API procedures. This package maps to **Layer 6: Governance Layer** in the 7-Layer Architecture.

## 2. Ownership

**Backend Team** - All changes require security review and approval.

## 3. Technology Stack

**Core:**
- NextAuth 5.0.0-beta.25
- @auth/prisma-adapter 2.7.4
- Prisma (database sessions via User, Account, Session tables)
- bcrypt for password hashing (≥10 rounds)

**Providers:**
- Credentials (email/password)
- Google OAuth
- Microsoft Azure AD OAuth
- SAML (enterprise SSO)

**Integration:**
- tRPC context & middleware
- Next.js App Router

## 4. Architecture

### Authentication Flow

```
User Login Request
    ↓
NextAuth Credentials Provider
    ↓
Verify email/password (bcrypt)
    ↓
Create database session (Prisma adapter)
    ↓
Set httpOnly cookie (session token)
    ↓
Return session to client
```

### Authorization Flow

```
API Request (with session cookie)
    ↓
tRPC context: auth(req, res)
    ↓
NextAuth verifies session token
    ↓
Retrieve user from database (with role, firmId)
    ↓
Attach session to tRPC context
    ↓
tRPC middleware: protectedProcedure
    ↓
Check authentication (ctx.session exists)
    ↓
Check authorization (role, firmId)
    ↓
Proceed to service layer
```

### Directory Structure

```
packages/auth/src/
├── index.ts                # Package exports
├── auth.ts                 # NextAuth configuration
├── trpc-context.ts         # tRPC context with session
├── middleware.ts           # tRPC middleware (protectedProcedure, requireRole, requireFirm)
├── utils.ts                # RBAC utilities
├── providers/
│   └── saml.ts            # SAML provider config (low priority)
└── __tests__/
    ├── auth.test.ts
    ├── middleware.test.ts
    └── utils.test.ts
```

## 5. NextAuth Configuration

### Core Config (src/auth.ts)

```typescript
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { db } from '@trato-hive/db';
import { compare } from 'bcrypt';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          firmId: user.firmId,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      // Attach user role and firmId to session
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.firmId = user.firmId;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
```

### Environment Variables

Required in `.env`:

```bash
# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

## 6. tRPC Integration

### Context with Session (src/trpc-context.ts)

```typescript
import { auth } from './auth';
import { db } from '@trato-hive/db';

export const createContext = async ({ req, res }) => {
  const session = await auth(req, res);

  return {
    session,
    db,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Protected Procedure (src/middleware.ts)

```typescript
import { TRPCError } from '@trpc/server';
import { t } from './trpc'; // tRPC instance

// Base authenticated procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  });
});
```

### Role-Based Middleware (src/middleware.ts)

```typescript
import { TRPCError } from '@trpc/server';

export const requireRole = (allowedRoles: string[]) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = ctx.session.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    return next();
  });
};

// Usage example
export const adminProcedure = requireRole(['Admin']);
export const managerProcedure = requireRole(['Admin', 'Manager']);
```

### Multi-Tenancy Middleware (src/middleware.ts)

```typescript
import { TRPCError } from '@trpc/server';

// Enforce firmId on all protected procedures
export const requireFirm = protectedProcedure.use(async ({ ctx, next }) => {
  const firmId = ctx.session.user.firmId;

  if (!firmId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User is not associated with a firm',
    });
  }

  return next({
    ctx: {
      ...ctx,
      firmId,
    },
  });
});
```

## 7. RBAC Roles & Permissions

### Role Definitions

- **Admin:** Full access to all features, can manage firm settings
- **Manager:** Manage deals, teams, documents; cannot modify firm settings
- **Analyst:** View and edit deals; cannot delete or manage teams
- **Viewer:** Read-only access to deals and documents

### RBAC Utilities (src/utils.ts)

```typescript
import type { Session } from 'next-auth';

// Check if user has specific role
export function hasRole(session: Session | null, role: string): boolean {
  if (!session?.user) return false;
  return session.user.role === role;
}

// Check if user has one of the allowed roles
export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  if (!session?.user) return false;
  return roles.includes(session.user.role);
}

// Check if user can access firm resources
export function canAccessFirm(session: Session | null, firmId: string): boolean {
  if (!session?.user) return false;
  return session.user.firmId === firmId;
}

// Check if user can access deal (must belong to same firm)
export async function canAccessDeal(
  session: Session | null,
  dealId: string,
  db: PrismaClient
): Promise<boolean> {
  if (!session?.user?.firmId) return false;

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    select: { firmId: true },
  });

  return deal?.firmId === session.user.firmId;
}

// Check if user can delete resources
export function canDelete(session: Session | null): boolean {
  return hasAnyRole(session, ['Admin', 'Manager']);
}

// Check if user can manage teams
export function canManageTeams(session: Session | null): boolean {
  return hasAnyRole(session, ['Admin', 'Manager']);
}

// Check if user can modify firm settings
export function canModifyFirmSettings(session: Session | null): boolean {
  return hasRole(session, 'Admin');
}
```

## 8. Next.js Integration

### App Router: Server Components

```typescript
import { auth } from '@trato-hive/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

### App Router: Client Components

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function ProfileButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <a href="/auth/signin">Sign in</a>;

  return <div>{session.user.name}</div>;
}
```

### API Route Handler

```typescript
import { auth } from '@trato-hive/auth';

export async function GET(req: Request) {
  const session = await auth(req);

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({ user: session.user });
}
```

## 9. SAML Provider (Low Priority)

For enterprise SSO, NextAuth supports SAML providers. Configuration is multi-tenant and stored per firm.

```typescript
// src/providers/saml.ts
import { SAMLProfile } from 'next-auth/providers/saml';

export function createSAMLProvider(firmId: string) {
  // Fetch SAML config from database for this firm
  const config = await db.firmSAMLConfig.findUnique({
    where: { firmId },
  });

  return {
    id: `saml-${firmId}`,
    name: 'Enterprise SSO',
    type: 'saml',
    issuer: config.issuer,
    entryPoint: config.entryPoint,
    cert: config.certificate,
  };
}
```

## 10. Security Requirements

### Password Hashing

Always use bcrypt with ≥10 rounds:

```typescript
import { hash } from 'bcrypt';

const passwordHash = await hash(password, 12); // 12 rounds
```

### Session Tokens

- Stored in httpOnly cookies (automatic via NextAuth)
- Cannot be accessed by client-side JavaScript
- Secure flag enabled in production (HTTPS only)

### CSRF Protection

- Built into NextAuth (automatic)
- All state-changing operations protected

### Secrets Management

- Never hardcode secrets
- All secrets from environment variables
- Use NEXTAUTH_SECRET (generate via `openssl rand -base64 32`)

### Rate Limiting

Implement rate limiting on auth routes:

```typescript
// apps/api/src/index.ts
fastify.register(rateLimit, {
  max: 5,
  timeWindow: '1 minute',
  hook: 'preHandler',
  keyGenerator: (req) => req.ip,
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  // Apply to auth routes
  allowList: ['/health'],
});
```

## 11. Testing Requirements

### Unit Tests

Test NextAuth config and RBAC utilities:

```typescript
// __tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { hasRole, canAccessFirm } from '../utils';

describe('RBAC utilities', () => {
  it('should return true for matching role', () => {
    const session = {
      user: { id: '1', role: 'Admin', firmId: 'firm-1' },
    };

    expect(hasRole(session, 'Admin')).toBe(true);
    expect(hasRole(session, 'Manager')).toBe(false);
  });

  it('should return true for matching firmId', () => {
    const session = {
      user: { id: '1', role: 'Admin', firmId: 'firm-1' },
    };

    expect(canAccessFirm(session, 'firm-1')).toBe(true);
    expect(canAccessFirm(session, 'firm-2')).toBe(false);
  });
});
```

### Integration Tests

Test tRPC middleware with mock sessions:

```typescript
// __tests__/middleware.test.ts
import { describe, it, expect } from 'vitest';
import { protectedProcedure, requireRole } from '../middleware';
import { TRPCError } from '@trpc/server';

describe('protectedProcedure', () => {
  it('should throw UNAUTHORIZED for missing session', async () => {
    const ctx = { session: null };

    await expect(
      protectedProcedure.use({ ctx, next: () => {} })
    ).rejects.toThrow(TRPCError);
  });

  it('should allow authenticated users', async () => {
    const ctx = {
      session: { user: { id: '1', role: 'Admin', firmId: 'firm-1' } },
    };

    await expect(
      protectedProcedure.use({ ctx, next: () => {} })
    ).resolves.not.toThrow();
  });
});

describe('requireRole', () => {
  it('should throw FORBIDDEN for insufficient role', async () => {
    const ctx = {
      session: { user: { id: '1', role: 'Viewer', firmId: 'firm-1' } },
    };

    await expect(
      requireRole(['Admin']).use({ ctx, next: () => {} })
    ).rejects.toThrow(TRPCError);
  });
});
```

**Coverage Requirements:**
- Unit tests: >80% coverage
- Integration tests: >70% coverage
- Focus on auth/authz edge cases

## 12. Exports

```typescript
// src/index.ts
export { auth, handlers, signIn, signOut } from './auth';
export { createContext } from './trpc-context';
export {
  protectedProcedure,
  requireRole,
  requireFirm,
  adminProcedure,
  managerProcedure,
} from './middleware';
export {
  hasRole,
  hasAnyRole,
  canAccessFirm,
  canAccessDeal,
  canDelete,
  canManageTeams,
  canModifyFirmSettings,
} from './utils';
```

## 13. Usage Examples

### In apps/api tRPC Router

```typescript
import { router } from './trpc';
import { protectedProcedure, requireRole } from '@trato-hive/auth';

export const dealRouter = router({
  // Requires authentication only
  list: protectedProcedure
    .input(z.object({ page: z.number() }))
    .query(async ({ ctx, input }) => {
      // ctx.session is guaranteed to exist
      return dealService.listDeals(input, ctx.session);
    }),

  // Requires Admin or Manager role
  delete: requireRole(['Admin', 'Manager'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return dealService.deleteDeal(input.id, ctx.session);
    }),
});
```

### In apps/web Next.js Page

```typescript
import { auth } from '@trato-hive/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  // Check role
  if (session.user.role !== 'Admin') {
    redirect('/dashboard');
  }

  return <SettingsForm />;
}
```

## 14. Non-Negotiables

1. **Always use database sessions** (never JWT for session management)
2. **Always use protectedProcedure** for authenticated tRPC endpoints
3. **Always enforce firmId** for multi-tenancy (via requireFirm)
4. **Always hash passwords** with bcrypt (≥10 rounds)
5. **Never store secrets in code** (use environment variables)
6. **Always validate roles** before sensitive operations
7. **Always write tests** for RBAC logic (>80% coverage)
