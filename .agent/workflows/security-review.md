---
description: Perform security audit and compliance verification
---

# Security Review Workflow

Use this workflow to perform security audits on code changes.

## 1. Code Security Audit

- **Auth:** Verify `requireAuth` on protected routes.
- **Input:** Verify Zod validation on all inputs.
- **Secrets:** Scan for hardcoded secrets/keys.
- **Injection:** Check for SQL injection or XSS risks.

## 2. API Security

- **Rate Limiting:** Verify implementation.
- **RBAC:** Verify role checks (`requireRole`).
- **Multi-tenancy:** Verify `firmId` enforcement (Row-Level Security).

## 3. Data Privacy & Logging

- **PII:** Verify encryption of sensitive data.
- **Audit:** Verify sensitive actions are logged (immutable).
- **Retention:** Check data retention compliance.

## 4. Dependency Check

- Scan for vulnerable dependencies.
- Verify license compliance.

## 5. Report Generation

Generate a report in the following format:

```markdown
## Security Review

**Decision:** [GREEN/YELLOW/RED]

### Findings

- [Critical/High/Medium/Low]: [Issue Description]

### Remediation

1.  [Step 1]
```
