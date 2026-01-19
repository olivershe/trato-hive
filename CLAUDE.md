# Trato Hive (v1.0): Unified System of Reasoning
**Core Principle:** Verifiable AI-Native M&A CRM built on a 7-Layer Architecture.
**Status:** Core Implementation (Phases 1-10) Complete. Ready for new feature development.

# 🚨 CRITICAL: Project Status & Workflow
**Source of Truth:** `/PROJECT_STATUS.md` (active work) + `/COMPLETED_WORK.md` (archive)
**Current Status:** Core v1.0 Complete (Phases 1-10). Ready for new feature development.

1. **Task IDs:** ALL items must use format `[TASK-###] Description` (e.g., `[TASK-001] Fix login`).
2. **The Workflow Loop:**
   - **Pick:** Select from `PROJECT_STATUS.md` backlog, GitHub issues, or user requests
   - **Read:** Read local `CLAUDE.md` in relevant scope (apps/packages/features)
   - **Branch:** Invoke `@git-workflow-manager` to create `feature/TASK-###`
   - **Plan:** Use TodoWrite tool for tracking (required for >1 file or complex tasks)
   - **Code:** Implement with TDD (Red → Green → Refactor)
   - **Test:** Run `pnpm test` and `pnpm typecheck`
   - **Commit:** Use `@git-workflow-manager` with `[TASK-###]` in message
   - **PR:** Open PR via `@git-workflow-manager`
   - **Simplify:** Use `@code-simplifier` on PR to refine code for clarity and consistency
   - **Update:** After merge, update `PROJECT_STATUS.md`

# 📚 Context Loading (Read Order)
1. **Status:** `PROJECT_STATUS.md` (active/future tasks) or `COMPLETED_WORK.md` (historical reference)
2. **Product:** `Trato Hive Product & Design Specification.md`
3. **Local Scope:** Read the `CLAUDE.md` in your specific `apps/` or `packages/` folder.
4. **Design:** For UI tasks, strictly follow `context/design-principles.md`.
5. **Git/Process:** Follow `docs/rules/git-workflow.md`.

# 🛠 Tech Stack & Standards
- **Framework:** Monorepo (pnpm + Turbo), Next.js 15 (App Router), tRPC v11, Fastify 5.
- **AI Core:** Anthropic Claude Sonnet 4.5, Vercel AI SDK, LangChain v0.3, BullMQ v5.
- **Semantic Layer:** Neo4j 5 (Knowledge Graph), Pinecone 5 (Vector Store), Prisma 6 (Postgres).
- **Data Plane:** Reducto AI (Document Parsing), AWS S3 (Storage).
- **Frontend:** React 19, Tiptap/Novel (Block Editor), Tailwind CSS 4, Zustand, TanStack Query.
- **Experience Paradigm:** Block-based architecture (Notion-style). Every content piece is a dynamic Block.
- **Testing:** Red → Green → Refactor. Vitest (Unit), Playwright (E2E), 70%+ coverage.
- **Security:** No secrets in code. Zod validation for all inputs.
- **Plan Mode:** MANDATORY for >1 file change.

# 🏗️ The 7-Layer Architecture
Data flows upward from infrastructure to experience. **See `/docs/architecture/` for full details.**

| Layer | Name | Primary Package | Key Tech |
|-------|------|-----------------|----------|
| 1 | **Data Plane** | `packages/data-plane/` | S3, Reducto, BullMQ |
| 2 | **Semantic Layer** | `packages/semantic-layer/` | Neo4j, Pinecone, Facts |
| 3 | **TIC Core** | `packages/ai-core/` | LLM, Embeddings, RAG |
| 4 | **Agentic Layer** | `packages/agents/` | DocumentAgent, DiligenceAgent |
| 5 | **Experience Layer** | `apps/web/`, `apps/api/` | Next.js, Tiptap, tRPC |
| 6 | **Governance Layer** | `packages/auth/`, `packages/db/` | NextAuth 5, Prisma, RBAC |
| 7 | **API Layer** | `apps/api/routes/` | Fastify routes, REST |

**Non-Negotiable:** Respect layer boundaries. Don't bypass layers (e.g., no direct DB access from UI if a service exists).

# 🤖 Core Agents
| Agent | Status | Purpose |
|-------|--------|---------|
| **DocumentAgent** | ✅ Complete | Document → OCR → Embedding → Facts → AI Suggestions |
| **DiligenceAgent** | ✅ Complete | Question → RAG → Answer + Citations |
| **SourcingAgent** | ⏸️ Stub | Company discovery & lookalike search |
| **PipelineAgent** | ⏸️ Stub | Deal monitoring & next-step suggestions |
| **GeneratorAgent** | ⏸️ Stub | IC deck and LOI document generation |

# 🎨 Design & UI (Pointer)
- **System:** The Intelligent Hive (Brand Pack v2.0).
- **Compliance:** BEFORE code, read `context/design-tokens.md` for Hex codes/Fonts.
- **Quick Check:** Run `/design-check` after minor UI changes.
- **Full Review:** Run `/review-ui-chrome` for comprehensive UI review via Chrome extension.
- **Colors:** Teal Blue (`#2F7E8A`) is for **CITATIONS ONLY**.

# 🔧 Tools & Commands
- `pnpm dev` / `pnpm test` / `pnpm build`
- **Context7 (MCP):** Use `mcp__context7__resolve-library-id` automatically for library docs.
- **Git:** Use `@git-workflow-manager` for branches, commits, PRs. Never commit directly to main.

# ✏️ Editor Development (Tiptap)
**BEFORE building new editor features**, check `/tiptap-component` skill first:
- **Use official Tiptap components** for: tables, emoji, image upload, formatting buttons, toolbars
- **Build custom blocks** for: anything needing tRPC/API calls, M&A-specific features, AI blocks

```bash
# Add official component (from apps/web/)
yes "" | npx @tiptap/cli add <component-name>

# Examples: table-node, emoji-dropdown-menu, image-upload-button
```

Custom blocks go in `apps/web/src/components/editor/extensions/` and must be registered in `extensions.ts`.

# 🏛️ Critical Workflows
**Architecture & Agents:**
- **7-Layer Architecture:** Data ownership rules critical for Modules 2-5 (see `/docs/architecture/`)
- **@architecture-review:** Invoke for multi-layer changes, new packages, DB schema changes
- **`/review-ui-chrome`:** Run for UI/UX reviews via Chrome extension (replaces @design-review)
- **@code-simplifier:** Invoke on PRs to refine code for clarity, consistency, and maintainability

**Logging (When Required):**
- **CHANGELOG.md:** User-visible changes, API changes, DB migrations
- **ERROR_LOG.md:** Bugs >30min to resolve or production errors

# 🧠 Reasoning Guidelines
1. **[Citation-First]**: AI outputs must have verifiable `[N]` citation markers.
2. **[Strict Architecture]**: Respect 7-layer boundaries. Use services, not raw DB calls.
3. **[Simplicity]**: Prefer "dumb" code and "smart" reasoning. Minimal line impact.
4. **[Multi-Tenancy]**: Every query/mutation MUST use `organizationId` from session.
5. **[Verification]**: Red → Green → Refactor. Always run `pnpm test` for affected package.
6. **[No Laziness]**: Find root causes. No temporary fixes. You are a senior developer.
7. **[Design Compliance]**: Teal Blue (`#2F7E8A`) is for **CITATIONS ONLY**.
8. **[Planning]**: Use TodoWrite tool to plan tasks. Check in before starting work.
9. **[Context7]**: Use Context7 MCP automatically for docs/examples.
10. **[Task IDs]**: Enforce `TASK-###` format in status and branch names.
