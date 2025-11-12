# Trato Hive: AI-Native M&A CRM - Project Rules & Architecture (Root)

Purpose: Authoritative global rules for the Trato Hive project. **Agents must read this file first** before any task.

## 1. Mandatory Reading Order

1. Root CLAUDE.md (this file)
2. Product Specification: `/Trato Hive Product & Design Specification.md`
3. If working inside an app/package/feature: read that folder's CLAUDE.md
4. For UI work: read `/context/design-principles.md` and `/context/style-guide.md`
5. If a PRD exists for the task: read `/docs/PRD.md` and relevant `/docs/prds/<feature>.md`
6. Then examine only the code in scope
7. In plan mode & commits: cite all files read

## 2. Product Context

Trato Hive is an AI-Native M&A CRM built as a "System of Reasoning" not an "AI-Augmented" database.

**Core Principles:**
1. **Verifiability First:** Every AI output must be hyperlinked to source documents (citation-first)
2. **Unified & Composable:** Sourcing + Pipeline + Diligence in one workflow, API-first
3. **Agentic Orchestration:** AI agents execute and orchestrate complex multi-step workflows

**5 Core Modules:**
- Module 1: Hive Command Center (dynamic dashboard)
- Module 2: Discovery (AI-Native sourcing)
- Module 3: Deals (Interactive Pipeline OS)
- Module 4: Diligence Room (AI-Native VDR)
- Module 5: Generator (Auditable material creation)

**7-Layer Architecture:**
1. Data Plane: Ingestion & Storage
2. Semantic Layer: Verifiable Fact Layer & Knowledge Graph
3. TIC: Trato Intelligence Core (Reasoning Engine)
4. Agentic Layer: AI Workflow Agents
5. Experience Layer: UI/UX & Generative Output
6. Governance Layer: Security & Audit
7. API Layer: Connectivity

## 3. Architecture Overview

**Hybrid Monorepo Structure:**
- `apps/`: Deployable applications (web frontend, api backend)
- `packages/`: Shared libraries mapped to 7-Layer Architecture
- `features/`: Domain modules mapped to 5 Core Modules

**Package-to-Architecture Mapping:**
- `packages/data-plane/` → Layer 1: Data Plane
- `packages/semantic-layer/` → Layer 2: Semantic Layer
- `packages/ai-core/` → Layer 3: TIC Core
- `packages/agents/` → Layer 4: Agentic Layer
- `apps/web/` → Layer 5: Experience Layer (Frontend)
- `apps/api/` → Layer 5: Experience Layer (Backend)
- Auth, audit, security distributed across → Layer 6: Governance Layer
- API routes in `apps/api/` → Layer 7: API Layer

**Feature-to-Module Mapping:**
- `features/command-center/` → Module 1
- `features/discovery/` → Module 2
- `features/deals/` → Module 3
- `features/diligence/` → Module 4
- `features/generator/` → Module 5

**Data Ownership:**
- Deals: owned by `features/deals/`
- Companies: owned by `features/discovery/`
- Documents: owned by `packages/data-plane/`
- Facts: owned by `packages/semantic-layer/`
- Users/Auth: owned by `packages/auth/`

**Service Boundaries:**
- Each feature exposes clear interfaces (services, routes, components)
- No direct database access from features; use package abstractions
- Cross-feature communication via events or shared packages

## 4. Coding Standards

**TypeScript:**
- Strict mode enabled
- No `any` types; use `unknown` if truly dynamic
- All exports must have explicit types
- Prefer interfaces over type aliases for object shapes

**Testing Requirements:**
- All new logic requires tests (Red → Green → Refactor)
- Unit tests: Jest (>=80% coverage for packages)
- Integration tests: Required for API routes and feature services
- E2E tests: Playwright for critical user flows (all 5 modules)
- Visual regression: Playwright snapshots for UI changes

**Formatting:**
- Prettier with 2-space indentation
- Single quotes for strings
- Trailing commas in multiline
- ESLint extends: `@typescript-eslint/recommended`, `prettier`

**Security:**
- No secrets in code; use environment variables
- All user inputs must be validated (Zod schemas in `packages/shared/validators/`)
- SQL injection prevention: use parameterized queries only
- XSS prevention: sanitize all user-generated content
- Authentication required for all routes except public landing pages
- Authorization checks on every protected operation
- Audit logging required for: data access, AI operations, document ingestion

**Performance:**
- Database queries must use proper indexes
- API routes must implement pagination for list endpoints
- Heavy computations must be async/background jobs
- Frontend: lazy load routes, code split large components

## 5. Workflow Protocols

**EPC Loop (Explore → Plan → Code → Verify):**

1. **Explore:**
   - Read: root CLAUDE.md → relevant app/package/feature CLAUDE.md → PRD(s) → code in scope
   - Summaries only; no code changes

2. **Plan (Plan Mode):**
   - Enter plan mode: `claude --permission-mode plan`
   - Produce actionable, test-first plan
   - Save to `plan.md` and update relevant feature PRDs
   - Plan must include: current state summary, detailed test-first steps, risks, decisions

3. **Code:**
   - Implement step-by-step following plan
   - Keep diffs small and reviewable
   - TDD cycle: Write failing test → Implement → Refactor → Verify

4. **Verify:**
   - Run tests: `pnpm test`
   - Typecheck: `pnpm typecheck`
   - Lint: `pnpm lint`
   - For UI changes: Quick Visual Check (see Section 8)

5. **Document:**
   - Update CHANGELOG.md if required (see Section 6)
   - Update ERROR_LOG.md if errors discovered (see Section 6)
   - Update relevant PRDs if requirements changed

**Plan Mode Requirements:**
- Plan mode required for any non-trivial task (>1 file change or >50 lines)
- Plans must be test-first with explicit file paths
- Plans must cite all files read
- Plans must identify risks and decisions

## 6. Git & CI Rules

### Git Workflow Management

**The `@git-workflow-manager` Agent:**
All Git operations (branching, commits, merges, rebases, PRs) should be handled by the git-workflow-manager agent to ensure consistency and safety. This agent is invoked proactively for:

- **Branch Operations:** Creating feature/fix/chore branches following naming conventions
- **Commits:** Crafting semantic commit messages with proper type/scope formatting
- **Pre-PR Preparation:** Rebasing on main, running tests, ensuring clean history
- **Conflict Resolution:** Handling merge conflicts during rebases
- **History Cleanup:** Squashing WIP commits, interactive rebases
- **PR Creation:** Final validation and pushing to remote

**When to Invoke:**
```
User signals:
- "I've finished implementing [feature]" → invoke for commit
- "Let's create a PR" → invoke for PR preparation
- "Start new feature [name]" → invoke for branch creation
- "Getting merge conflicts" → invoke for conflict resolution
- "Clean up commits" → invoke for history cleanup
```

**Branching Strategy:**
- `main`: protected branch, requires PR + reviews
- `feature/{slug}`: new features
- `fix/{slug}`: bug fixes
- `chore/{slug}`: maintenance, deps, tooling

**Commit Message Format:**
```
type(scope): brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`
Scopes: `deals`, `discovery`, `diligence`, `generator`, `command-center`, or package names

**Pull Requests:**
- PRs must reference: plan summary, test evidence, updated logs
- PR description must include: "Closes #issue", acceptance criteria checklist
- Required checks: tests pass, lint pass, typecheck pass, security scan pass
- For UI PRs: attach 1440px screenshots and design review decision

**Safety Rules (enforced by git-workflow-manager):**
- Backup branch created before destructive operations (rebase, force push, hard reset)
- Secret scanning on all commits (API keys, tokens, credentials)
- No .env files or sensitive config in commits
- Tests must pass before push
- No force push to main
- No rebasing public/shared branches

**CI Pipeline (.github/workflows/ci.yml):**
1. Install dependencies
2. Run typecheck across all packages
3. Run linter
4. Run unit tests with coverage
5. Run integration tests
6. Security scan (npm audit, Snyk)
7. For apps/web changes: Playwright visual regression

## 7. Logging Protocols

### CHANGELOG.md

**When to update:**
- User-visible changes (new features, UI updates, behavior changes)
- API contract changes (breaking or non-breaking)
- Database migrations
- Risky dependency upgrades (major versions, security patches)

**Format:**
```markdown
## [Unreleased]

### Added
- [Module] Description with rationale (#PR-link)

### Changed
- [Module] Description with rationale (#PR-link)

### Fixed
- [Module] Description with rationale (#PR-link)

### Security
- [Module] Description with rationale (#PR-link)
```

**Slash Command:** `/log:changelog {summary}`

### ERROR_LOG.md

**When to update:**
- Any runtime error discovered in production, staging, or local
- CI failures that require investigation
- Development errors that took >30min to resolve

**Format:**
```markdown
## [YYYY-MM-DD HH:MM] - {Component}

**Symptom:** Brief description of the error
**Reproduction:** Steps to reproduce
**Suspected Cause:** Root cause analysis
**Status:** Fixed | Investigating | Workaround
**Fix PR:** #link (if resolved)
```

**Slash Command:** `/log:error {symptom}`

### Automation & Enforcement

- Agents may use `/log:changelog` and `/log:error` to append entries
- PRs touching user-facing code or APIs require CHANGELOG entry
- PRs fixing bugs require ERROR_LOG entry
- CI will fail if logs are missing when required (checked via script)

## 8. Design Governance (The Intelligent Hive)

### Design System Tokens

**Colors:**
- Soft Sand: `#F5EFE7` (primary background, panels)
- Gold/Honey: `#E2A74A` (accents, CTAs, citations)
- Charcoal Black: `#1A1A1A` (primary text, structural elements)
- Teal Blue: `#2F7E8A` (AI insights, links, intelligence)

**Typography:**
- Headings (H1, H2, H3): Modern Serif (Lora or Playfair Display)
- Body/Labels/Buttons: Modern Sans Serif (Inter or Public Sans)

**UI Principles:**
- Rounded edges on all components (8px border-radius minimum)
- Hexagonal patterns for abstract backgrounds and data viz
- Soft gradient panels for depth
- Gold accent lines to separate key sections
- Citation links always in Teal Blue with [cite] notation
- All numbers in verifiable contexts must be hyperlinked

### Visual Development Protocol

**Quick Visual Check (after any UI change):**
1. Identify changed components/pages
2. Navigate affected pages via Playwright browser control
3. Verify design compliance: check `/context/design-principles.md` & `/context/style-guide.md`
4. Validate feature intent: ensure change fulfills acceptance criteria
5. Capture evidence: full-page screenshot at 1440px desktop viewport
6. Check errors: run console messages check and fix issues
7. Log: attach screenshots to PR; update CHANGELOG if user-visible

**Comprehensive Design Review (before PR merge of significant UI/UX):**
- Invoke `@agent-design-review` for accessibility, responsiveness, token usage checks
- Require Green decision (or resolved Yellow items) before merge

**Slash Commands:**
- `/design:quick-check {scope}`: Run Quick Visual Check on {scope}
- `/design:review {scope}`: Invoke comprehensive design review agent

## 9. Tools & Commands

**Root Package Scripts:**
- `pnpm install`: Install all dependencies
- `pnpm dev`: Start all development servers (web + api)
- `pnpm build`: Build all apps and packages
- `pnpm test`: Run all tests across workspace
- `pnpm test:watch`: Watch mode for tests
- `pnpm typecheck`: TypeScript checking across workspace
- `pnpm lint`: Lint all code
- `pnpm lint:fix`: Auto-fix linting issues
- `pnpm format`: Format code with Prettier

**App-Specific:**
- `pnpm --filter web dev`: Start web frontend only
- `pnpm --filter api dev`: Start API backend only
- `pnpm --filter web test`: Test web app only
- `pnpm --filter api test`: Test API app only

**Docker:**
- `docker-compose up`: Start local services (Postgres, Redis, Vector DB)
- `docker-compose down`: Stop local services

## 10. Non-Negotiables

1. **Investigate before answering:** Never hallucinate code or facts
2. **Respect reading order:** Root CLAUDE.md → local CLAUDE.md → PRDs → code
3. **Citation-first principle:** All AI-generated facts must link to sources
4. **Test-first development:** No production code without tests
5. **Respect logging obligations:** Update logs per Section 7 rules
6. **Security first:** No shortcuts on auth, validation, or encryption
7. **Design compliance:** All UI changes must follow The Intelligent Hive system
8. **Plan mode for complexity:** Use plan mode for non-trivial changes
9. **Small diffs:** Keep PRs focused and reviewable (<500 lines ideal)
10. **Always cite sources:** In plan mode and PRs, reference all files read

## 11. Agent Collaboration & Escalation

**Specialized Agents:**
The Trato Hive project uses specialized agents for domain-specific tasks. Invoke proactively when user signals indicate the need:

**`@git-workflow-manager`** - All Git operations
- Branch creation, commits, merges, rebases
- Conflict resolution, history cleanup
- PR preparation and validation
- Secret scanning and safety checks
- Invoke when: user finishes feature, requests PR, encounters conflicts, wants to start new work

**`@agent-architecture-review`** - Architecture compliance
- Changes spanning multiple layers
- New packages or features
- Cross-feature integration
- Database schema changes
- API design reviews
- Invoke when: major refactoring, new modules, performance concerns

**`@agent-design-review`** - UI/UX quality assurance
- Visual consistency validation
- Accessibility compliance
- Responsive design testing
- Token usage verification
- Invoke when: significant UI changes, before merging UI PRs

**For critical security issues:**
- Immediately flag in ERROR_LOG.md with [SECURITY] prefix
- Invoke `@agent-security-review` for immediate assessment (if available)
- Coordinate with `@git-workflow-manager` to prevent committing secrets
- Do not proceed with deployment until resolved

**For architecture decisions:**
- Invoke `@agent-architecture-review` for major changes
- Document decision in `/docs/architecture/decisions/{number}-{slug}.md`

**For design conflicts:**
- Invoke `@agent-design-review` for resolution
- Defer to `/context/design-principles.md` as source of truth
