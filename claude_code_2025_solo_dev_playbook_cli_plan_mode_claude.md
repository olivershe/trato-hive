# Claude Code 2025 Solo Dev Playbook (Revised: Hybrid Monorepo Only)

A fully revised, unified 2025 playbook optimised for Claude Code via CLI, plan mode, and strict project‑wide & folder‑level `CLAUDE.md` governance. This version removes the older Template 1/3 options and standardises everything around the **Hybrid Monorepo** structure (apps + packages + features), which provides the cleanest long‑term architecture, the best context zoning, and the most predictable behaviour for AI-assisted development.

---

## A) Full Step‑by‑Step Workflow (Project creation → planning → architecture → coding → logging → Git)

### 0) One‑time machine setup
1. **Install tooling**: Claude CLI, Git, GitHub CLI, Node/PNPM, Python/Poetry, Docker, test runners.
2. **Configure Claude**:
   - `~/.claude/config` → safe defaults, editor, preferred model, permissions.
   - Create a `~/claude-templates` folder containing reusable prompts & agents.

---

## 1) Project Bootstrapping (new repo)
1. **Init repo**
   ```bash
   mkdir my-app && cd my-app
   git init -b main
   ```
2. **Base files**
   ```bash
   echo "# my-app" > README.md
   echo "node_modules
.dist
.env*
**/.DS_Store" > .gitignore
   npx license mit > LICENSE
   ```
3. **Create Hybrid Monorepo skeleton** (see section J below – now the only option).
4. **Create Claude workspace**
   - Root `CLAUDE.md`
   - `.claude/` with `context.md`, `rules.md`, `prompts.md`, `agents/*`
   - `apps/web/CLAUDE.md`, `apps/api/CLAUDE.md`
   - `packages/*/CLAUDE.md`
   - Optional `features/*/CLAUDE.md`
5. **Initial commit**
   ```bash
   git add -A && git commit -m "chore: bootstrap monorepo and Claude workspace"
   ```
6. **Open Claude**
   ```bash
   claude
   ```
7. **Run `/init`** and refine the generated context + update all relevant `CLAUDE.md` files.

---

## 2) Planning Loop: EPC (Explore → Plan → Code → Verify)

### Explore
- Claude reads: **root `CLAUDE.md` → relevant app/package/feature `CLAUDE.md` → PRD(s) → code in scope**.
- Summaries only; no code changes.

### Plan (Plan Mode)
- Enter plan mode: `claude --permission-mode plan`.
- Produce an actionable, test‑first plan.
- Save plans to `plan.md` and relevant feature PRDs.

### Code
- Implement step‑by‑step.
- Keep diffs small; use tests → implement → refactor.

### Verify
- Tests, typecheck, lint.
- UI visual diffs via Playwright.

### Document
- Update `CHANGELOG.md` and `ERROR_LOG.md` per the root logging rules.

---

## 3) GitHub & Branching Workflow
- Branching: `main` protected; `feature/*`, `fix/*`, `chore/*`.
- Claude can run `git` & `gh` via CLI.
- PRs must reference: plan steps, updated logs, acceptance criteria.
- Optional GitHub Actions: security, design review, coverage gates.

---

## 4) Logs & Hygiene
- **CHANGELOG.md**: update on any user-visible change, API update, migration, or risky dependency upgrade.
- **ERROR_LOG.md**: log any runtime/dev/CI error with repro steps and suspected cause.
- Provide slash-commands `/log:changelog` and `/log:error` for Claude to append.

---

# B) Prompt Libraries (copy/paste)

## Plan Mode: Full Engineering Plan
```
<mode:plan>
Goal: Prepare a test-first, file-by-file engineering plan.
Read order: root CLAUDE.md → local CLAUDE.md → PRDs → code in scope.
Output:
1. Current state summary.
2. Detailed, test-first plan (R→G→R) with explicit files.
3. Risks, decisions, assumptions.
4. Artifacts to update (plan.md, PRDs, migrations).
No code yet.
</mode:plan>
```

## Plan Mode: Coding Session Prep
```
<mode:plan>
Prepare a 60–90 min session plan for FEATURE "{name}".
Include: tasks, file diffs, tests, commands, done-checklist.
Respect CLAUDE.md and PRD.
</mode:plan>
```

## Architecture Review
```
<mode:plan>
Review {component} for security, performance, API correctness.
Return: blockers, improvements, and a green/yellow/red decision.
</mode:plan>
```

## Repo Improvement Scan
```
Read root + local CLAUDE.md, plan.md, logs.
Return 5–10 improvements with rationale & effort.
```

## GitHub Workflow
```
Create branch feature/{slug}; stage diffs; semantic commit; push; open PR.
Ensure CHANGELOG and ERROR_LOG updated.
```

---

# C) `.claude.md` Blueprint Table

| File | Location | Purpose | Must Contain |
|---|---|---|---|
| `CLAUDE.md` (root) | project root | Global rules, architecture, reading order | Logging rules, Git rules, workflow protocols |
| `.claude/context.md` | `.claude/` | 1‑screen project mission | Stack, primary flows, intended users |
| `.claude/rules.md` | `.claude/` | Hard guardrails | Security, formatting, test mandates |
| `.claude/prompts.md` | `.claude/` | Slash-commands & reusable prompts | Plan mode macros, git workflows |
| `.claude/agents/*` | `.claude/agents/` | Specialist agents | Git manager, security reviewer |
| `apps/*/CLAUDE.md` | per app | App-specific rules | FE/BE conventions, tests, perf rules |
| `packages/*/CLAUDE.md` | per package | Library-specific rules | Ownership, interfaces, versioning |
| `features/*/CLAUDE.md` | per feature | Domain module rules | Boundaries, acceptance criteria |
| `/docs/prds/*.md` | PRDs | Requirements | Goals, constraints, acceptance, risks |

---

# D) PRDs (How They Work Here)
- **Root PRD**: overall product.
- **Feature PRDs**: `/docs/prds/<feature>.md`.
- **Claude reading order**: root `CLAUDE.md` → local `CLAUDE.md` → PRD(s) → code.

PRD template:
```
# PRD: <Feature>
Problem
Goals / Non-Goals
UX
Data & APIs
Acceptance Criteria
Risks
Rollout
```

---

# E) Folder Strategy (Hybrid Monorepo – ONLY OPTION)

The definitive 2025 structure.
```
my-app/
  .claude/
    context.md
    rules.md
    prompts.md
    agents/

  apps/
    web/           # Frontend app
      CLAUDE.md
      src/
      tests/

    api/           # Backend app
      CLAUDE.md
      src/
      tests/

  packages/        # Shared libraries
    ui/
      CLAUDE.md
    db/
      CLAUDE.md
    auth/
      CLAUDE.md
    shared/
      CLAUDE.md

  features/        # Optional domain modules
    payments/
      CLAUDE.md
      doc.md
    search/
      CLAUDE.md
      doc.md

  docs/
    PRD.md         # Root PRD
    prds/
      payments.md
      search.md

  CLAUDE.md        # Root (always read first)
  plan.md
  CHANGELOG.md
  ERROR_LOG.md
```

**Benefits**
- Clear FE/BE deployables under `apps/`.
- Shared, versioned libraries under `packages/`.
- Optional domain‑driven modules under `features/`.
- Perfect for Claude’s context zoning with nested `CLAUDE.md` files.

---

# F) GitHub Integration (Exact Rules)
- Claude may run git & gh commands.
- Commit messages must be semantic.
- PRs require: plan summary, tests, logs updated.
- Merges must not proceed unless CHANGELOG & ERROR_LOG entries are valid.

---

# G) Slash‑Command Library (store in `.claude/prompts.md`)
```
/feature {slug}
Create branch feature/{slug}; update plan.md; run tests.

/log:changelog {summary}
Append to CHANGELOG under Unreleased.

/log:error {symptom}
Append timestamped entry to ERROR_LOG.md.

/review:architecture {component}
Run architecture review.
```

---

# H) Template: Root `CLAUDE.md` (Revised & Expanded)
```
# Project Rules & Architecture (Root)
Purpose: Authoritative global rules. **Agents must read this file first** before any task.

## 1. Mandatory Reading Order
1. Root `CLAUDE.md` (this file).
2. If working inside an app/package/feature directory: read that folder's `CLAUDE.md`.
3. If a PRD exists for the task: read `/docs/PRD.md` and `/docs/prds/<feature>.md`.
4. Then examine only the code in scope.
5. In plan mode & commits: cite all files read.

## 2. Architecture Overview
- Hybrid Monorepo with apps, packages, and optional features.
- Data ownership, schema authorities, service boundaries.

## 3. Coding Standards
- TypeScript strict, Python 3.12+ if used, formatting rules.
- Tests required for all new logic.
- No speculative coding; investigate files before proposing changes.

## 4. Workflow Protocols
- EPC loop: Explore → Plan → Code → Verify.
- **Plan Mode required** for any non-trivial task.
- Follow TDD: Red → Green → Refactor.
- Keep diffs small and verifiable.

## 5. Git & CI Rules
- Branching: feature/*, fix/*, chore/*.
- PRs must include: plan summary, tests evidence, updated logs.
- Required checks: tests, lint, typecheck, security review.

## 6. Logging Protocols
### When to update CHANGELOG.md
- User-visible changes.
- API contract changes.
- Migrations.
- Risky dependency upgrades.
- Format: entry under **Unreleased** with rationale + PR link.

### When to update ERROR_LOG.md
- Any discovered error: dev, CI, runtime.
- Include: timestamp, component, symptom, suspected cause, fix PR.

### Automation
- Agents may use `/log:changelog` and `/log:error` to append entries.
- PRs must be rejected if logs are missing when required.

## 7. Tools
- Commands for dev server, tests, lint, typecheck, visual diffs.
- All test/lint commands must pass before Claude proceeds.

## 8. Non‑Negotiables
- Investigate before answering.
- Never hallucinate code not present.
- Respect reading order.
- Respect logging obligations.
- Always cite sources in plan mode.
```

---

# M) UI/Design Governance (Integrated Visual Development Loop)

This section integrates design‑review practices so visual changes are **consistent, testable, and evidence‑backed**.

### M1. Required design context files
Create these files and keep them short and actionable:
```
/context/
  design-principles.md   # canonical design principles & UX heuristics
  style-guide.md         # brand tokens, typography, spacing, components
```
**Reading order for UI work:** Root `CLAUDE.md` → `apps/web/CLAUDE.md` → `/context/design-principles.md` & `/context/style-guide.md` → PRD(s) → code in scope.

### M2. Quick Visual Check (run after any UI change)
1) **Identify changes**: list modified components/pages.  
2) **Navigate affected pages**: use MCP browser control (e.g., `mcp__playwright__browser_navigate`) to open each changed view.  
3) **Verify design compliance**: compare against `/context/design-principles.md` and `/context/style-guide.md`.  
4) **Validate feature intent**: ensure change fulfils the specific user request/acceptance criteria.  
5) **Capture evidence**: take a full‑page screenshot at **1440px** desktop viewport for each changed view.  
6) **Check errors**: run `mcp__playwright__browser_console_messages` and fix surfaced issues.  
7) **Log**: attach screenshots and a short note to the PR; update CHANGELOG if user‑visible.

### M3. Comprehensive Design Review (before PR merge of significant UI/UX)
- Invoke sub‑agent **`@agent-design-review`** to run accessibility, responsiveness, component API consistency, and visual regression checks.  
- Require a **green** decision (or resolved **yellow** items) before merge.

### M4. Frontend `CLAUDE.md` additions (append to `apps/web/CLAUDE.md`)
```
## Visual Development Protocol
- Always read /context/design-principles.md and /context/style-guide.md before proposing visual changes.
- After implementing changes: run Quick Visual Check (M2) and attach evidence.
- For significant UI work: escalate to @agent-design-review before opening/merging PRs.
```

### M5. Agents & Commands
Create a design review agent and slash commands under `.claude/`:
```
.claude/agents/design-review.md
Role: UI/UX compliance reviewer.
Reads: apps/web/CLAUDE.md, /context/design-principles.md, /context/style-guide.md, relevant PRD.
Checks: a11y (WCAG short list), responsiveness, token usage, component API hygiene, console errors.
Output: Decision (Green/Yellow/Red) + evidence notes + action list.

.claude/prompts.md
/design:quick-check {scope}
- Run Quick Visual Check (M2) on {scope}; attach 1440px screenshots and console messages summary.

/design:review {scope}
- Invoke @agent-design-review for comprehensive validation; summarise issues and decision.
```

### M6. CI hooks (optional but recommended)
- Add a GitHub Action to run Playwright visual snapshots on PRs touching `apps/web/**` and post diffs as PR artifacts.  
- Block merge if @agent-design-review returns Red.

---

**End of Revised Playbook**

