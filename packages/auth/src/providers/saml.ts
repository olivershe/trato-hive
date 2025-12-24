/**
 * SAML Provider Placeholder (Phase 6.3)
 *
 * This is a PLACEHOLDER for future enterprise SSO implementation.
 * SAML authentication will be added when enterprise customers require it.
 *
 * Future Implementation Strategy:
 * 1. Use BoxyHQ SAML Jackson (@boxyhq/saml-jackson) OR
 * 2. Use NextAuth built-in SAML provider with dynamic configuration
 *
 * Multi-Tenancy Approach:
 * - Store SAML configuration per organization in database
 * - Lookup SAML config by email domain during sign-in
 * - Redirect to organization-specific IdP for authentication
 *
 * Database Schema Changes Required (Future):
 * ```prisma
 * model Organization {
 *   // ... existing fields
 *
 *   // SAML SSO Configuration
 *   samlEnabled       Boolean  @default(false)
 *   samlMetadataUrl   String?  // IdP metadata URL
 *   samlEntityId      String?  // SP entity ID
 *   samlDomain        String?  // Email domain for SAML routing (e.g., "company.com")
 *   samlCertificate   String?  // IdP signing certificate
 * }
 * ```
 *
 * Dependencies Required (Future):
 * ```json
 * {
 *   "dependencies": {
 *     "@boxyhq/saml-jackson": "^1.x.x"
 *   }
 * }
 * ```
 *
 * Usage Example (Future):
 * ```typescript
 * import { SAMLProvider } from './providers/saml';
 *
 * export const { handlers, auth } = NextAuth({
 *   providers: [
 *     Google(...),
 *     AzureAD(...),
 *     SAMLProvider({
 *       id: 'saml',
 *       name: 'Enterprise SSO',
 *       // Dynamic config lookup based on organization
 *     }),
 *   ],
 * });
 * ```
 *
 * Sign-In Flow (Future):
 * 1. User enters email on login page
 * 2. Extract domain from email (e.g., user@company.com → "company.com")
 * 3. Query Organization table: `WHERE samlDomain = "company.com" AND samlEnabled = true`
 * 4. If SAML configured:
 *    - Redirect to organization-specific SAML IdP
 *    - User authenticates with enterprise credentials
 *    - IdP redirects back with SAML assertion
 *    - Verify assertion and create session
 * 5. If no SAML:
 *    - Show standard OAuth options (Google, Microsoft)
 *    - OR show password login (if credentials provider enabled)
 *
 * @see https://boxyhq.com/docs/jackson/overview
 * @see https://next-auth.js.org/providers/saml
 */

import type { OAuthConfig } from 'next-auth/providers';

/**
 * SAML Provider (PLACEHOLDER - NOT IMPLEMENTED)
 *
 * This function throws an error to prevent accidental usage.
 * Implement this when enterprise SSO is required.
 *
 * @param config - SAML configuration
 * @throws {Error} Always throws - not implemented yet
 */
export function SAMLProvider(_config: {
  id: string;
  name: string;
  // Future: Add SAML-specific config fields
}): OAuthConfig<any> {
  throw new Error(
    'SAML provider not implemented yet (Phase 6.3 placeholder). ' +
      'Enterprise SSO will be added when enterprise customers require it. ' +
      'See packages/auth/src/providers/saml.ts for implementation strategy.'
  );
}

/**
 * SAML Configuration Type (Future)
 *
 * This type defines the structure for per-organization SAML config.
 */
export interface SAMLConfig {
  enabled: boolean;
  metadataUrl: string;
  entityId: string;
  domain: string; // Email domain for routing
  certificate?: string;
}

/**
 * Helper: Get SAML config for organization (Future)
 *
 * Fetches SAML configuration from database based on email domain.
 *
 * @param emailDomain - Email domain (e.g., "company.com")
 * @returns SAML config or null if not configured
 */
export async function getSAMLConfigByDomain(
  _emailDomain: string
): Promise<SAMLConfig | null> {
  // Future implementation:
  // const org = await prisma.organization.findFirst({
  //   where: { samlDomain: emailDomain, samlEnabled: true },
  // });
  //
  // if (!org) return null;
  //
  // return {
  //   enabled: org.samlEnabled,
  //   metadataUrl: org.samlMetadataUrl!,
  //   entityId: org.samlEntityId!,
  //   domain: org.samlDomain!,
  //   certificate: org.samlCertificate,
  // };

  throw new Error('SAML config lookup not implemented yet');
}
