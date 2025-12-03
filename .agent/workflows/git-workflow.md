---
description: Standard Git workflows for Trato Hive (Branching, Committing, PRs)
---

# Git Workflow Manager

This workflow defines the standard procedures for Git operations in Trato Hive, derived from the project's governance rules.

## 1. Start New Feature

Use this when starting a new task.

1.  Ensure clean state.
    ```bash
    git status
    ```
2.  Switch to main and update.
    ```bash
    // turbo
    git checkout main && git pull origin main
    ```
3.  Create feature branch (Replace `TASK-###` and `description`).
    ```bash
    git checkout -b feature/TASK-###-description
    ```

## 2. Create Semantic Commit

Use this when saving work.

1.  Stage files.
    ```bash
    git add .
    ```
2.  Verify staged changes.
    ```bash
    // turbo
    git diff --cached --stat
    ```
3.  Commit with semantic message.
    Format: `type(scope): description`
    - **Types**: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`
    - **Scopes**: `deals`, `discovery`, `diligence`, `generator`, `command-center`, `packages`, `infra`
    - **Example**: `feat(deals): implement kanban board drag-and-drop`
    ```bash
    git commit -m "type(scope): description"
    ```

## 3. Prepare for PR

Use this before opening a Pull Request.

1.  Fetch latest main.
    ```bash
    // turbo
    git fetch origin main
    ```
2.  Rebase on main (Interactive).
    ```bash
    git rebase origin/main
    ```
    _If conflicts arise, resolve them manually, then run `git rebase --continue`._
3.  Run verification.
    ```bash
    pnpm test && pnpm typecheck
    ```
4.  Push branch.
    ```bash
    git push origin HEAD
    ```

## 4. Safety Protocols

- **Backup:** Before complex rebases, run `git branch backup-$(git branch --show-current)`.
- **Secrets:** Ensure no `.env` files or keys are in `git diff --cached`.
