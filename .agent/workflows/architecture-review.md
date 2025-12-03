---
description: Conduct a 7-Layer Architecture review for code changes
---

# Architecture Review Workflow

Use this workflow to validate code changes against Trato Hive's 7-Layer Architecture.

## 1. Preparation

1.  Read `CLAUDE.md` (Architecture Overview).
2.  Read relevant package/feature `CLAUDE.md` files.
3.  Identify all modified files and touched layers.

## 2. Layer Compliance Validation

Verify code placement and responsibilities for each touched layer:

- **Layer 1 (Data Plane):** Ingestion/OCR/Storage only. No business logic.
- **Layer 2 (Semantic Layer):** Facts/Graph/Vectors only. All facts must have citations.
- **Layer 3 (TIC Core):** LLM orchestration/Embeddings only.
- **Layer 4 (Agentic Layer):** Multi-step workflows only.
- **Layer 5 (Experience Layer):** UI (`apps/web`) and API (`apps/api`). No direct DB access.
- **Layer 6 (Governance):** Auth/Audit/Security.
- **Layer 7 (API):** REST conventions, Zod validation.

## 3. Data Ownership Validation

- **Deals:** Owned by `features/deals`.
- **Companies:** Owned by `features/discovery`.
- **Documents:** Owned by `packages/data-plane`.
- **Facts:** Owned by `packages/semantic-layer`.
- **Users:** Owned by `packages/auth`.
- **Rule:** No cross-feature direct DB access. Must use exported interfaces.

## 4. API Design Review (If Applicable)

- Check HTTP methods (GET/POST/PUT/DELETE).
- Check resource naming (Plural nouns).
- Check Zod input validation.
- Check error handling and status codes.

## 5. Performance & Scalability

- Check for N+1 queries.
- Check for missing indexes.
- Verify multi-tenancy (`firmId` isolation).
- Ensure stateless API design.

## 6. Report Generation

Generate a report in the following format:

```markdown
## Architecture Review

**Decision:** [GREEN/YELLOW/RED]

### Findings

- [Layer] - [Pass/Fail]: [Details]
- [Data Ownership] - [Pass/Fail]: [Details]

### Required Actions

1.  [Action 1]
```
