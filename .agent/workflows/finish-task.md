---
description: Automate the "Test -> Commit -> Update Status" sequence
---

# Finish Task Workflow

Use this workflow to complete a task and prepare it for merging.

## 1. Verification

1.  Run all relevant tests.
    ```bash
    pnpm test
    ```
2.  Run type checking.
    ```bash
    pnpm typecheck
    ```
3.  (If UI) Run Design Review Workflow.
4.  (If Architecture) Run Architecture Review Workflow.

## 2. Commit Changes

1.  Run Git Workflow to prepare for PR (Rebase + Semantic Commit).
    ```bash
    # Ensure commit message includes [TASK-###]
    ```

## 3. Update Status

1.  Edit `PROJECT_STATUS.md`:
    - Mark `[TASK-###]` as `[x]` or `✅`.
    - Update "Latest Commit" and "Overall Progress".
    - Note: Completed tasks are periodically archived to `COMPLETED_WORK.md`.

## 4. Documentation

1.  Create `walkthrough.md` summarizing:
    - Changes made.
    - Verification evidence (screenshots/logs).
    - Files touched.

## 5. Final Push

1.  Push the branch to remote.
    ```bash
    git push origin HEAD
    ```
2.  Notify user to open PR.
