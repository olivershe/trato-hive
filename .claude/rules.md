# Trato Hive: Hard Guardrails

This document defines non-negotiable rules that must never be violated. Agents should fail loudly if asked to break these rules.

## Security Guardrails

### 1. Authentication & Authorization
- **NEVER** skip authentication checks on protected routes
- **NEVER** use `user.role === 'admin'` without proper RBAC middleware
- **ALWAYS** implement row-level security (users can only access their firm's data)
- **ALWAYS** use JWT with httpOnly cookies, never localStorage for sensitive tokens

### 2. Input Validation
- **NEVER** trust user input without validation
- **ALWAYS** use Zod schemas from `packages/shared/validators/` for all inputs
- **ALWAYS** sanitize user-generated content before rendering (XSS prevention)
- **ALWAYS** use parameterized queries (Prisma), never string concatenation (SQL injection prevention)

### 3. Secrets Management
- **NEVER** commit secrets, API keys, or credentials to version control
- **ALWAYS** use environment variables for sensitive configuration
- **NEVER** expose secrets in error messages or logs
- **ALWAYS** rotate secrets regularly and document rotation procedures

### 4. Data Encryption
- **ALWAYS** encrypt sensitive data at rest (AES-256)
- **ALWAYS** use TLS 1.3 for data in transit
- **NEVER** log sensitive data (passwords, tokens, PII) in plain text
- **ALWAYS** hash passwords with bcrypt (min 10 rounds)

### 5. Audit Logging
- **ALWAYS** log: authentication events, data access, AI operations, document uploads
- **NEVER** allow audit logs to be edited or deleted (immutable)
- **ALWAYS** include: timestamp, user ID, action, resource ID, IP address
- **ALWAYS** store audit logs separately from application logs

## Code Quality Guardrails

### 1. TypeScript Strictness
- **NEVER** use `any` type (use `unknown` if truly dynamic)
- **NEVER** use `@ts-ignore` or `@ts-expect-error` without documented justification
- **ALWAYS** enable `strict: true` in tsconfig.json
- **ALWAYS** provide explicit return types for functions

### 2. Testing Requirements
- **NEVER** merge code without tests
- **ALWAYS** write tests before implementation (TDD: Red → Green → Refactor)
- **ALWAYS** maintain >=80% code coverage for packages
- **ALWAYS** run all tests before pushing (no skipped tests in CI)

### 3. Error Handling
- **NEVER** swallow errors silently (`catch {}`)
- **ALWAYS** log errors with context
- **ALWAYS** return user-friendly error messages (not stack traces)
- **ALWAYS** use custom error classes (NotFoundError, UnauthorizedError, etc.)

### 4. Performance
- **NEVER** perform database queries in loops (N+1 problem)
- **ALWAYS** add database indexes for foreign keys and frequently queried fields
- **ALWAYS** implement pagination for list endpoints (default limit: 20, max: 100)
- **NEVER** block the event loop with synchronous operations in Node.js

## Design Guardrails (The Intelligent Hive)

### 1. Color Usage
- **NEVER** use colors outside the defined palette (Soft Sand, Gold, Charcoal Black, Teal Blue)
- **ALWAYS** meet WCAG 2.1 AA contrast ratios (4.5:1 for text, 3:1 for large text)
- **NEVER** rely on color alone to convey information (use icons or text labels too)
- **ALWAYS** use Teal Blue for citations and AI-generated content

### 2. Typography
- **NEVER** use font sizes smaller than 12px (Caption)
- **ALWAYS** use Lora/Playfair for headings, Inter/Public Sans for body/UI
- **NEVER** use more than 3 font weights on a single page
- **ALWAYS** maintain consistent line heights (1.4-1.6 for readability)

### 3. Spacing & Layout
- **NEVER** use arbitrary pixel values (always use spacing tokens: 4px base unit)
- **ALWAYS** use minimum 8px border-radius (rounded edges are brand identity)
- **NEVER** create layouts that don't work on mobile (<768px)
- **ALWAYS** use 1440px as the design target viewport

### 4. Citation-First Principle
- **NEVER** display AI-generated facts without citation links
- **ALWAYS** style citations in Teal Blue with underline
- **ALWAYS** make citations clickable (opens modal with source document)
- **NEVER** hide citations in tooltips or collapsed sections (first-class UI element)

## Workflow Guardrails

### 1. Plan Mode
- **NEVER** implement non-trivial changes (>1 file, >50 lines) without a plan
- **ALWAYS** enter plan mode: `claude --permission-mode plan`
- **ALWAYS** cite all files read in plans
- **ALWAYS** save plans to `plan.md` and relevant PRDs

### 2. Git & Version Control
- **NEVER** commit directly to `main` branch
- **ALWAYS** use semantic commit messages: `type(scope): message`
- **NEVER** force push to shared branches
- **ALWAYS** rebase feature branches before merging

### 3. Logging Protocols
- **NEVER** skip CHANGELOG.md updates for user-visible changes or API updates
- **NEVER** skip ERROR_LOG.md updates for bugs or runtime errors
- **ALWAYS** use the format specified in root CLAUDE.md
- **ALWAYS** link CHANGELOG entries to PR numbers

### 4. Pull Requests
- **NEVER** merge PRs without passing CI checks
- **NEVER** merge PRs without code review (minimum 1 approval)
- **ALWAYS** include: plan summary, test evidence, updated logs in PR description
- **ALWAYS** attach 1440px screenshots for UI changes

## Data Governance Guardrails

### 1. Privacy & GDPR
- **NEVER** train AI models on user data (firm policy: no training)
- **ALWAYS** implement data deletion requests within 30 days (GDPR Right to Erasure)
- **ALWAYS** get explicit consent before processing personal data
- **NEVER** share user data with third parties without consent

### 2. Data Retention
- **ALWAYS** retain audit logs for 7 years (compliance requirement)
- **ALWAYS** implement automated backups (6-hour intervals)
- **NEVER** store document content in application database (use S3)
- **ALWAYS** implement soft deletes for critical data (deals, documents)

### 3. Multi-Tenancy
- **ALWAYS** enforce firm-level data isolation (row-level security)
- **NEVER** allow cross-firm data access (except for super-admin support)
- **ALWAYS** include `firmId` in all database queries for multi-tenant tables
- **ALWAYS** validate `firmId` matches authenticated user's firm

## AI/ML Guardrails

### 1. Citation Integrity
- **NEVER** generate facts without source document references
- **ALWAYS** store citation metadata: sourceId, pageNumber, excerpt, confidence
- **ALWAYS** implement human-in-loop review for AI-generated answers
- **NEVER** present AI outputs as absolute truth (always show confidence levels)

### 2. Prompt Engineering
- **ALWAYS** sanitize user inputs before including in LLM prompts (prompt injection prevention)
- **NEVER** expose raw LLM responses without post-processing
- **ALWAYS** implement rate limiting for AI API calls (prevent abuse)
- **ALWAYS** log all AI interactions for audit trail

### 3. Model Governance
- **ALWAYS** version control prompts and model configurations
- **NEVER** change production prompts without A/B testing
- **ALWAYS** monitor AI hallucination rates (target: <5%)
- **ALWAYS** implement fallback mechanisms for AI failures

## Performance Guardrails

### 1. Response Times
- **NEVER** allow API responses >5s without async/background job
- **ALWAYS** implement timeouts for external API calls (30s max)
- **ALWAYS** use database connection pooling (Prisma default)
- **NEVER** allow frontend bundle size >500KB (initial load)

### 2. Caching
- **ALWAYS** cache frequently accessed data (Redis, 5min TTL)
- **ALWAYS** invalidate cache on data updates
- **NEVER** cache sensitive data (auth tokens, PII)
- **ALWAYS** implement cache warming for critical paths

### 3. Database
- **ALWAYS** use database transactions for multi-step operations
- **NEVER** perform full table scans (always use indexes)
- **ALWAYS** monitor slow queries (>500ms)
- **ALWAYS** implement read replicas for heavy read workloads (future)

## Escalation Rules

### When to Stop and Ask
- **STOP** if asked to implement features that contradict security guardrails
- **STOP** if asked to skip tests or reduce coverage
- **STOP** if asked to use colors/fonts outside The Intelligent Hive design system
- **STOP** if asked to display AI-generated facts without citations
- **STOP** if unclear about data ownership or service boundaries

### How to Escalate
1. Log concern in ERROR_LOG.md with [ESCALATION] prefix
2. Invoke appropriate agent: `@agent-security-review`, `@agent-architecture-review`, or `@agent-design-review`
3. Document decision in `/docs/architecture/decisions/` (ADR format)
4. Never proceed with implementation until resolved

## Enforcement

These rules are enforced through:
- Automated checks in CI pipeline (linting, tests, security scans)
- Pre-commit hooks (formatting, type checking)
- Code review checklists (PR templates)
- Agent validation (Claude Code reads this file first)

**Violation of these guardrails is a blocker for PR approval and deployment.**
