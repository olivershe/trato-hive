---
description: Automate the "Pick -> Read -> Branch -> Plan" sequence
---

# Start Task Workflow

Use this workflow to begin working on a new task from `PROJECT_STATUS.md`.

## 1. Identify Task

1.  Read `PROJECT_STATUS.md` to find the next `[TASK-###]`.
2.  Confirm the task scope and requirements.

## 2. Load Context

1.  Read the root `CLAUDE.md`.
2.  Read the relevant `CLAUDE.md` for the task's package/feature (e.g., `packages/ui/CLAUDE.md`).
3.  Read `Trato Hive Product & Design Specification.md` if relevant.

## 3. Initialize Git

1.  Run the Git Workflow to start a feature branch.
    ```bash
    # Example: git checkout -b feature/TASK-001-description
    ```

## 4. Create Plan Artifacts

1.  Create `implementation_plan.md` with:
    - Goal
    - Proposed Changes
    - Verification Plan
2.  Create `task.md` with:
    - Step-by-step checklist
    - `[ ]` items for tracking

## 5. User Notification

1.  Notify the user that the environment is ready and present the plan for approval.
