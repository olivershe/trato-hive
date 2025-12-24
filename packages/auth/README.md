# @trato-hive/auth

Multi-tenant authentication and authorization package for Trato Hive using NextAuth.js v5.

## Features

- 🔐 **NextAuth.js v5** with database-backed sessions
- 🏢 **Multi-Tenancy** via organization-based isolation
- 👥 **RBAC** with role hierarchy (OWNER > ADMIN > MEMBER > VIEWER)
- 🔗 **OAuth Integration** (Google, Microsoft Azure AD)
- 🔒 **Account Linking** with organization membership enforcement
- ⚡ **Edge-Compatible** configuration for middleware
- 🧪 **Type-Safe** session with TypeScript augmentation

## Installation

This package is part of the Trato Hive monorepo and is not published separately.

```bash
pnpm add @trato-hive/auth
```

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# NextAuth v5 Configuration
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft Azure AD (Optional)
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"
```

### Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

## OAuth Provider Setup

### Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** to your `.env` file

**Required Scopes:**
- `openid`
- `email`
- `profile`

### Microsoft Azure AD

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Enter a name for your app (e.g., "Trato Hive")
5. Select **Accounts in this organizational directory only** (Single tenant)
6. Add redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/azure-ad`
   - Production: `https://your-domain.com/api/auth/callback/azure-ad`
7. Click **Register**
8. Copy the **Application (client) ID** to `AZURE_AD_CLIENT_ID`
9. Copy the **Directory (tenant) ID** to `AZURE_AD_TENANT_ID`
10. Navigate to **Certificates & secrets** > **Client secrets**
11. Click **New client secret**, add a description, and set expiration
12. Copy the **Value** to `AZURE_AD_CLIENT_SECRET` (NOT the Secret ID)

**Required API Permissions:**
- `User.Read` (delegated)
- `email` (delegated)
- `openid` (delegated)
- `profile` (delegated)

## Usage

### Basic Auth Check

```typescript
import { auth } from '@trato-hive/auth';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <div>Welcome, {session.user.name}!</div>;
}
```

### Multi-Tenancy Enforcement

```typescript
import { auth, canAccessOrganization } from '@trato-hive/auth';

export default async function DealPage({ params }: { params: { id: string } }) {
  const session = await auth();

  // Fetch deal from database
  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
  });

  // Enforce organization isolation
  if (!canAccessOrganization(session, deal.organizationId)) {
    throw new Error('Unauthorized: Cannot access deal from different organization');
  }

  return <div>{deal.name}</div>;
}
```

### Role-Based Access Control

```typescript
import { auth, hasMinimumRole } from '@trato-hive/auth';

export default async function AdminPanel() {
  const session = await auth();

  // Require ADMIN or OWNER role
  if (!hasMinimumRole(session, 'ADMIN')) {
    throw new Error('Forbidden: Requires ADMIN role or higher');
  }

  return <div>Admin Panel</div>;
}
```

### tRPC Integration

```typescript
import { auth } from '@trato-hive/auth';
import { prisma } from '@trato-hive/db';

export const createContext = async () => {
  const session = await auth();

  return {
    session,
    db: prisma,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

## RBAC Utilities

### Role Hierarchy

```
OWNER (4)    - Full control, can delete organization
   ↓
ADMIN (3)    - Manage users, settings, deals
   ↓
MEMBER (2)   - Create/edit deals, documents
   ↓
VIEWER (1)   - Read-only access
```

### Available Functions

#### `hasRole(session, role)`

Check if user has a specific role.

```typescript
import { hasRole } from '@trato-hive/auth';

if (hasRole(session, 'OWNER')) {
  // User is owner
}
```

#### `hasAnyRole(session, roles[])`

Check if user has any of the specified roles.

```typescript
import { hasAnyRole } from '@trato-hive/auth';

if (hasAnyRole(session, ['OWNER', 'ADMIN'])) {
  // User is owner or admin
}
```

#### `hasMinimumRole(session, minRole)`

Check if user's role is equal to or higher than the minimum required role.

```typescript
import { hasMinimumRole } from '@trato-hive/auth';

if (hasMinimumRole(session, 'MEMBER')) {
  // User is MEMBER, ADMIN, or OWNER
}
```

#### `canAccessOrganization(session, organizationId)`

Check if user belongs to the specified organization (multi-tenancy enforcement).

```typescript
import { canAccessOrganization } from '@trato-hive/auth';

if (!canAccessOrganization(session, deal.organizationId)) {
  throw new Error('Unauthorized');
}
```

#### `canEditBlock(session, blockType)`

Check if user can edit a specific block type (Block Protocol integration).

```typescript
import { canEditBlock } from '@trato-hive/auth';

if (canEditBlock(session, 'DealHeaderBlock')) {
  // User can edit this block
}
```

## Account Linking

The package automatically links OAuth accounts to existing users by email. The account linking flow:

1. User signs in with Google/Microsoft
2. System checks if user with same email exists in database
3. If exists:
   - Prisma adapter automatically links the OAuth account
   - Enforces organization membership requirement
   - Rejects sign-in if user has no organization memberships
4. If not exists:
   - Creates new user account
   - Requires invitation/organization setup before allowing access

### Security Considerations

- **`allowDangerousEmailAccountLinking: true`** is used for convenience
- Only enable for trusted OAuth providers (Google, Microsoft)
- Production systems should implement email verification before linking
- All account linking events are logged for audit

## Session Enrichment

The package enriches the NextAuth session with:

- `user.id` - User ID from database
- `user.organizationId` - Primary organization for multi-tenancy
- `user.role` - User's role in the organization (RBAC)

This enables type-safe access to organization and role data throughout the application:

```typescript
const session = await auth();
// TypeScript knows: session.user.organizationId is string | undefined
// TypeScript knows: session.user.role is OrganizationRole | undefined
```

## Multi-Organization Support

**Current Implementation:**
- Users can belong to multiple organizations
- Session uses first joined organization as primary (`orderBy: { createdAt: 'asc' }`)

**Future Enhancement:**
- Add organization switching UI
- Store active `organizationId` in cookie or session state
- Update session callback to accept `organizationId` parameter

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

See `packages/auth/tests/` for test examples.

## Architecture

### Split Config Pattern

For edge runtime compatibility:

- **auth.config.ts** - Edge-safe configuration (no Prisma imports)
- **auth.ts** - Node.js instance with Prisma adapter

### Files

```
packages/auth/src/
├── auth.config.ts      # Edge-compatible config
├── auth.ts             # NextAuth instance
├── types.ts            # Type augmentation
├── utils.ts            # RBAC utilities
├── providers/          # Custom providers
│   └── saml.ts         # SAML placeholder
└── index.ts            # Package exports
```

## Security Best Practices

1. **Always use `AUTH_SECRET`** (not `NEXTAUTH_SECRET` for v5)
2. **Database sessions** for revocability
3. **Enforce organization isolation** in all queries
4. **Use HTTPS** for OAuth callback URLs in production
5. **Rotate secrets** regularly
6. **Monitor failed sign-in attempts**
7. **Log all authorization failures**

## Troubleshooting

### "No organization membership" error

Users must be invited to an organization before they can sign in. Create an organization membership:

```typescript
await prisma.organizationMember.create({
  data: {
    userId: user.id,
    organizationId: organization.id,
    role: 'MEMBER',
  },
});
```

### OAuth callback errors

Ensure callback URLs match exactly in OAuth provider settings:
- Development: `http://localhost:3000/api/auth/callback/{provider}`
- Production: `https://your-domain.com/api/auth/callback/{provider}`

### TypeScript errors

Ensure `packages/auth/src/types.ts` is included in your `tsconfig.json`:

```json
{
  "include": ["**/*.ts", "**/*.tsx"]
}
```

## License

Proprietary - Trato Hive
