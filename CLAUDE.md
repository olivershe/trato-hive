# Trato Hive: AI-Native M&A CRM
**Core Principle:** System of Reasoning (Verifiable, Unified, Agentic).

# 🚨 CRITICAL: Project Status & Workflow
**Source of Truth:** `/PROJECT_STATUS.md`
1. **Task IDs:** ALL items must use format `[TASK-###] Description` (e.g., `[TASK-001] Fix login`).
2. **The Workflow Loop:**
   - **Pick:** Select `[TASK-###]` from PROJECT_STATUS.md
   - **Read:** Read local `CLAUDE.md` in relevant scope (apps/packages/features)
   - **Branch:** Invoke `@git-workflow-manager` to create `feature/TASK-###`
   - **Plan:** Use TodoWrite tool for tracking (required for >1 file or complex tasks)
   - **Code:** Implement with TDD (Red → Green → Refactor)
   - **Test:** Run `pnpm test` and `pnpm typecheck`
   - **Commit:** Use `@git-workflow-manager` with `[TASK-###]` in message (auto-syncs Notion)
   - **PR:** Open PR via `@git-workflow-manager`
   - **Update:** After merge, tick ✅ `[TASK-###]` in PROJECT_STATUS.md

# 📚 Context Loading (Read Order)
1. **Status:** `PROJECT_STATUS.md` (Check for next `TASK-###`)
2. **Product:** `Trato Hive Product & Design Specification.md`
3. **Local Scope:** Read the `CLAUDE.md` in your specific `apps/` or `packages/` folder.
4. **Design:** For UI tasks, strictly follow `context/design-principles.md`.
5. **Git/Process:** Follow `docs/rules/git-workflow.md`.

# 🛠 Tech Stack & Standards
- **Stack:** Monorepo, TypeScript (Strict), Next.js 14, Supabase.
- **Testing:** Red → Green → Refactor. Unit (Jest), E2E (Playwright).
- **Security:** No secrets in code. Zod validation for inputs.
- **Plan Mode:** MANDATORY for >1 file change.

# 🎨 Design & UI (Pointer)
- **System:** The Intelligent Hive (Brand Pack v2.0).
- **Compliance:** BEFORE code, read `context/design-tokens.md` for Hex codes/Fonts.
- **Check:** Run `/design:quick-check` after UI changes.
- **Colors:** Teal Blue (`#2F7E8A`) is for **CITATIONS ONLY**.

# 🤖 Tools & Commands
- `pnpm dev` / `pnpm test` / `pnpm build`
- **Context7 (MCP):** Use `mcp__context7__resolve-library-id` automatically for library docs.
- **Git Agent:** `@git-workflow-manager` is MANDATORY for all git ops.
  - **Rule:** Never commit directly to main. Always use `feature/TASK-###`.

# 🧠 Behavioral Rules
<behavioral_rules>
  <rule>Active Rules: Print "[Citation-First] [Test-First] [Security Verified]" at start.</rule>
  <rule>Enforce `TASK-###` format in status and branch names.</rule>
  <rule>Update `PROJECT_STATUS.md` after every task. No exceptions.</rule>
  <rule>Investigate before answering: No hallucinated code.</rule>
  <rule>Use Context7 automatically for docs/examples.</rule>
</behavioral_rules>

# 🏗️ Critical Workflows
**Architecture & Agents:**
- **7-Layer Architecture:** Data ownership rules critical for Modules 2-5 (see `/docs/architecture/`)
- **@architecture-review:** Invoke for multi-layer changes, new packages, DB schema changes
- **@design-review:** Invoke for significant UI/UX changes before PR merge

**Notion Integration:**
- Auto-syncs via `[TASK-###]` tags in commit messages (handled by `@git-workflow-manager`)
- Updates task status on PR merge (GitHub Actions)
- Bidirectional sync runs daily (PROJECT_STATUS.md ↔ Notion)

**Logging (When Required):**
- **CHANGELOG.md:** User-visible changes, API changes, DB migrations
- **ERROR_LOG.md:** Bugs >30min to resolve or production errors

Claude Rules:
1. First think through the problem, read the codebase for relevant files, and use TodoWrite tool to plan tasks.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Every step of the way, give me a high-level explanation of what changes you made.
6. Make every task as simple as possible. Avoid massive or complex changes. Impact as little code as possible. Everything is about simplicity.
7. Finally, give a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY.
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY.
