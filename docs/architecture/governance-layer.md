# Governance Layer

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Security & Compliance Team
**Priority:** Critical

The **Governance Layer** (Layer 6) provides the security and compliance backbone for Trato Hive. It ensures that only authorized users can access data, that sensitive information is protected at rest and in transit, and that all actions are traceable. This document outlines the responsibilities, package mapping, and best practices for this layer.

## 1. Responsibilities

1. **Authentication:** Verify the identity of users and services. Support JSON Web Tokens (JWT), OAuth 2.0 and SAML where appropriate. Tokens should carry claims such as `userId`, `firmId`, roles and expiration.
2. **Authorization:** Enforce role‑based access control (RBAC) and row‑level security. Every database query must include a `firmId` filter to prevent data leakage across tenants. Roles include Admin, Manager, Analyst and Viewer.
3. **Audit Logging:** Record all significant actions (login, document ingestion, deal updates, fact creation, agent execution) with timestamps, user identifiers and metadata. Logs must be immutable and retained according to compliance policies.
4. **Encryption:** Use AES‑256 for data at rest (including databases and object storage) and TLS 1.3 for data in transit. Secrets are managed via a secure vault system. Regular key rotation and zero‑trust principles apply.
5. **Compliance:** Align with SOC 2 Type II controls and GDPR requirements. Implement data deletion on request (“right to be forgotten”), consent tracking for data subjects, and avoid training models on customer data without explicit permission【516335038796236†L90-L99】.
6. **Multi‑Tenant Isolation:** Ensure that each firm’s data is logically isolated. Use separate databases or schemas per firm where possible. Shared services must enforce row‑level filtering.
7. **Security Scanning & Secret Management:** Integrate static and dynamic application security testing (SAST/DAST) into CI. Secrets should never be hard‑coded; use environment variables or secret stores. Regularly scan dependencies for vulnerabilities.

## 2. Package Mapping

| Component | Description |
|-----------|-------------|
| **`packages/auth/`** | Implements authentication services, JWT issuance and validation, token refresh flow and integration with external identity providers (OAuth, SAML). |
| **`packages/db/`** | Provides database access with row‑level security enforcement. Contains RBAC enforcement middleware. |
| **Distributed Concerns** | Audit logging middleware across `apps/api/` and `packages/agents/`; encryption utilities in `packages/security/` (to be created). |

## 3. Authentication Details

- **JWT:** Primary mechanism for API authentication. Tokens signed with RSA keys; include claims for `userId`, `firmId`, `roles`, and `exp`. Short token lifetimes (15 minutes) with refresh tokens stored in HTTP‑only cookies. Use JWKs for key rotation.
- **OAuth 2.0 / SAML:** External authentication for enterprise clients. Use third‑party identity providers (Okta, Azure AD) via standard protocols. Avoid vendor‑specific integrations that incur recurring costs; rely on open standards.
- **Session Management:** Stateless sessions for APIs (JWT) and server‑side sessions for Next.js when required (e.g., user dashboards). Implement CSRF protection where cookies are used.

## 4. Authorization and Row‑Level Security

- **Role‑Based Access Control (RBAC):** Define roles (Admin, Manager, Analyst, Viewer) and privileges (e.g., create deal, view documents, generate reports). Map roles to endpoints via middleware. Deny by default; require explicit grants.
- **Row‑Level Security:** All queries must include a `firmId` filter. At the database level, use Row‑Level Security (RLS) policies (e.g., PostgreSQL RLS) to enforce this rule. Do not rely on application‑level checks alone.
- **Least Privilege:** Services should run with the minimum set of permissions they require. Separate service accounts for data ingestion, AI processing and user operations.

## 5. Audit Logging

Every significant user or system action must be logged. Logs include:
- **timestamp:** ISO8601 UTC timestamp.
- **userId:** The authenticated user performing the action (if service‑initiated, a service account ID).
- **firmId:** Tenant identifier.
- **action:** The high‑level action (e.g., `createDeal`, `ingestDocument`, `generateICDeck`).
- **resourceId:** ID of the resource affected (deal ID, document ID, etc.).
- **metadata:** Additional context (e.g., number of files ingested, query text). Logs should be immutable and stored in an append‑only datastore. Retention periods must satisfy both business and regulatory requirements (e.g., 7 years for financial records).

## 6. Encryption

- **At Rest:** All data in databases and object storage (S3) must be encrypted using AES‑256. KMS (Key Management Service) keys should be used with automatic rotation. Backups are encrypted separately.
- **In Transit:** Enforce TLS 1.3 for all communications. TLS certificates managed by an automated certificate manager (e.g., Let’s Encrypt). HTTPS is mandatory for both internal and external services.

## 7. Compliance Guidelines

- **SOC 2 Type II:** Follow controls covering security, availability and confidentiality. Conduct annual external audits. Maintain incident response procedures and perform regular risk assessments.
- **GDPR:** Provide data export and deletion endpoints. Track consent for data ingestion and processing. Avoid training AI models on personal data without consent. Implement Data Protection Impact Assessments (DPIAs) where necessary.
- **Data Residency:** If required by clients, support data residency options by deploying stacks in specific regions (e.g., EU, US). Keep metadata separate from content to simplify compliance.

## 8. Multi‑Tenant Isolation

Implement isolation strategies:
- **Database Isolation:** Use separate schemas or databases per firm. Ensure indices do not leak firm identifiers. Apply encryption keys per tenant if required.
- **Secret Separation:** Each tenant’s configuration (e.g., API keys to third‑party services) is stored separately and encrypted. Do not reuse secrets across tenants.
- **Resource Tagging:** Tag resources (e.g., S3 buckets, compute instances) with `firmId` for cost tracking and access control.

## 9. Security Scanning & Secret Management

- **CI/CD Scanning:** Integrate security scanners (e.g., Snyk, Dependabot) into the CI pipeline to detect vulnerabilities in dependencies. Fail builds if high‑severity vulnerabilities are found.
- **Static Analysis:** Use tools (e.g., ESLint with security plugins, Bandit for Python) to detect insecure coding patterns.
- **Secret Management:** Store secrets in a vault (e.g., HashiCorp Vault, AWS Secrets Manager). Rotate keys regularly. Never commit secrets to source control【516335038796236†L90-L99】.

## 10. Conclusion

The Governance Layer is the foundation of trust in Trato Hive. By enforcing strict authentication and authorization, comprehensive audit logging, robust encryption and compliance with SOC 2 and GDPR, we protect our clients’ sensitive data. As with other layers, we favour open standards and self‑hosted solutions to minimise recurring costs and vendor lock‑in.
