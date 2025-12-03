# Trato Hive: AI-Native M&A CRM (Antigravity Context)

**Core Principle:** System of Reasoning (Verifiable, Unified, Agentic).

# 🚨 CRITICAL: Project Status & Workflow

**Source of Truth:** `/PROJECT_STATUS.md`

## The Automated Workflow Loop

1.  **Start Task:** Use `/start-task` (Automates: Pick → Read → Branch → Plan).
2.  **Code:** Implement with TDD (Red → Green → Refactor).
3.  **Review:**
    - **UI:** Use `/design-review` (Automates: Visual/Accessibility checks).
    - **Architecture:** Use `/architecture-review` (Automates: 7-Layer checks).
    - **Security:** Use `/security-review` (Automates: Audit checks).
4.  **Finish Task:** Use `/finish-task` (Automates: Test → Commit → Update Status → Push).

# 📚 Context Loading (Read Order)

1.  **Status:** `PROJECT_STATUS.md`
2.  **Product:** `Trato Hive Product & Design Specification.md`
3.  **Local Scope:** Read the `CLAUDE.md` in your specific `apps/` or `packages/` folder.
4.  **Design:** `context/design-principles.md`
5.  **Git/Process:** `.agent/workflows/git-workflow.md`

# 🛠 Tech Stack & Standards

- **Stack:** Monorepo, TypeScript (Strict), Next.js 14, Supabase.
- **Testing:** Red → Green → Refactor. Unit (Jest), E2E (Playwright).
- **Security:** No secrets in code. Zod validation for inputs.
- **Plan Mode:** MANDATORY for >1 file change (Use `implementation_plan.md`).

# 🎨 Design & UI (Pointer)

- **System:** The Intelligent Hive (Brand Pack v2.0).
- **Compliance:** BEFORE code, read `context/design-tokens.md`.
- **Colors:** Teal Blue (`#2F7E8A`) is for **CITATIONS ONLY**.

# 🏗️ Critical Workflows

**Architecture & Agents:**

- **7-Layer Architecture:** Data ownership rules critical for Modules 2-5 (see `/docs/architecture/`).
- **Review Workflows:** Always use the automated workflows (`/architecture-review`, `/design-review`) before finishing a task.

**Notion Integration:**

- Auto-syncs via `[TASK-###]` tags in commit messages (handled by `/finish-task`).

# 🧠 Antigravity Behavioral Rules

1.  **Workflow First:** Always prefer using defined workflows (`.agent/workflows/*.md`) over manual execution.
2.  **Artifact Driven:** Use `task.md`, `implementation_plan.md`, and `walkthrough.md` for all complex tasks.
3.  **Citation-First:** Print "[Citation-First] [Test-First] [Security Verified]" at start of major tasks.
4.  **No Hallucinations:** Investigate before answering.
5.  **Simplicity:** Make every task as simple as possible. Impact as little code as possible.
