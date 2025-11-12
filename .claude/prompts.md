# Trato Hive: Slash Commands & Reusable Prompts

This document provides slash commands and reusable prompts for common workflows. Store these in your Claude Code CLI configuration for quick access.

## Slash Commands Library

### Planning & Architecture

#### /feature {slug}
```
Create a new feature branch and prepare for implementation:
1. Create branch: feature/{slug}
2. Read relevant PRD from /docs/prds/
3. Update plan.md with feature implementation plan
4. Run tests to establish baseline
5. Report: branch created, plan ready, tests passing
```

#### /plan {task}
```
<mode:plan>
Goal: Prepare a test-first, file-by-file engineering plan for {task}.

Reading order:
1. Root CLAUDE.md
2. Relevant local CLAUDE.md (app/package/feature)
3. Relevant PRDs from /docs/prds/
4. Code in scope

Output:
1. Current state summary
2. Detailed test-first plan (Red → Green → Refactor) with explicit file paths
3. Risks, decisions, assumptions
4. Artifacts to update (plan.md, PRDs, migrations, logs)

No code implementation yet. Plan only.
</mode:plan>
```

#### /plan:session {duration} {feature}
```
<mode:plan>
Prepare a {duration}-minute coding session plan for FEATURE "{feature}".

Include:
- Specific tasks with time estimates
- File diffs to create
- Tests to write (with test names)
- Commands to run (dev server, test runner)
- Done checklist for session end

Respect CLAUDE.md and PRD. Keep scope realistic for time available.
</mode:plan>
```

### Code Review & Quality

#### /review:architecture {component}
```
<mode:plan>
Review {component} for:
1. Security vulnerabilities (OWASP Top 10, auth/authz, input validation)
2. Performance issues (N+1 queries, missing indexes, blocking operations)
3. API correctness (RESTful conventions, error handling, response formats)
4. Architecture alignment (7-Layer Architecture, service boundaries, data ownership)
5. Code quality (TypeScript strictness, error handling, test coverage)

Return:
- Decision: Green (approve) / Yellow (concerns to address) / Red (blockers)
- Issues list with severity (Critical/High/Medium/Low)
- Recommendations with rationale
</mode:plan>
```

#### /review:security {scope}
```
<mode:plan>
Security audit for {scope}:

Checklist:
- [ ] Authentication: All protected routes require auth
- [ ] Authorization: RBAC implemented, row-level security enforced
- [ ] Input validation: Zod schemas used, XSS prevention, SQL injection prevention
- [ ] Secrets: No secrets in code, env vars used, no secrets in logs
- [ ] Encryption: AES-256 at rest, TLS 1.3 in transit
- [ ] Audit logging: All sensitive actions logged
- [ ] Rate limiting: API rate limits implemented
- [ ] CORS: Whitelist configured correctly

Return: Pass/Fail with specific issues and remediation steps.
</mode:plan>
```

#### /review:design {component}
```
Invoke @agent-design-review for comprehensive UI/UX validation:

Checks:
1. The Intelligent Hive compliance (colors, typography, spacing, border-radius)
2. Accessibility (WCAG 2.1 AA: keyboard nav, color contrast, ARIA labels)
3. Responsiveness (mobile, tablet, laptop, desktop breakpoints)
4. Citation-first principle (all AI facts have teal blue citation links)
5. Component API hygiene (prop types, defaults, documentation)
6. Console errors (browser console clean)

Return: Decision (Green/Yellow/Red) with evidence notes and action list.
```

### Logging

#### /log:changelog {summary}
```
Append entry to CHANGELOG.md under [Unreleased]:

Format:
### [Added/Changed/Fixed/Security]
- [{Module}] {summary} (#{PR-number})

Example:
### Added
- [Deals] Implement Verifiable Fact Sheet with citation links (#123)

Follow root CLAUDE.md Section 7 for when to update CHANGELOG.
```

#### /log:error {symptom}
```
Append timestamped entry to ERROR_LOG.md:

Format:
## [YYYY-MM-DD HH:MM] - {Component}

**Symptom:** {Brief description of the error}
**Reproduction:** {Steps to reproduce}
**Suspected Cause:** {Root cause analysis}
**Status:** Investigating | Fixed | Workaround
**Fix PR:** #{link} (if resolved)

Follow root CLAUDE.md Section 7 for when to update ERROR_LOG.
```

### Design & UI

#### /design:quick-check {scope}
```
Run Quick Visual Check on {scope}:

1. Identify changed components/pages
2. List affected routes/views
3. For each view:
   - Navigate in browser
   - Verify design compliance (/context/design-principles.md, /context/style-guide.md)
   - Validate feature intent (acceptance criteria)
   - Capture 1440px screenshot
   - Check console for errors
4. Generate report with:
   - Screenshots attached
   - Compliance checklist (colors, typography, spacing, border-radius, citations)
   - Issues found with severity
   - Recommendation: Approve / Needs revision

Attach report to PR.
```

#### /design:tokens
```
Display current design system tokens:

Colors:
- Soft Sand: #F5EFE7 (background)
- Gold/Honey: #E2A74A (accents, CTAs, citations)
- Charcoal Black: #1A1A1A (text)
- Teal Blue: #2F7E8A (AI insights, links)

Typography:
- Headings: Lora or Playfair Display (serif)
- Body/UI: Inter or Public Sans (sans-serif)

Spacing:
- Base unit: 4px
- Common: space-2 (8px), space-4 (16px), space-6 (24px), space-8 (32px)

Border Radius:
- Minimum: 8px (radius-md)

Reference: /context/style-guide.md for full specification.
```

### Testing

#### /test:unit {scope}
```
Run unit tests for {scope}:

Command: pnpm --filter {scope} test

If tests fail:
1. Display failure output
2. Analyze root cause
3. Suggest fixes
4. Update ERROR_LOG.md if bug discovered

If tests pass:
Display coverage report. Flag if <80% coverage for packages.
```

#### /test:e2e {flow}
```
Run E2E test for user flow "{flow}":

Command: pnpm --filter web test:e2e --grep "{flow}"

For UI flows, capture screenshots at key steps.

If tests fail:
1. Display failure with screenshots
2. Analyze: Is this a test issue or a real bug?
3. Update ERROR_LOG.md if real bug
4. Suggest fix or test update

If tests pass:
Confirm flow working as expected.
```

### Git & GitHub

#### /git:branch {type}/{slug}
```
Create and switch to new branch:

Types: feature | fix | chore

Command: git checkout -b {type}/{slug}

After creation:
1. Run tests to establish baseline
2. Update plan.md with task details
3. Confirm ready to code
```

#### /git:commit {type} {scope} {message}
```
Stage changes and create semantic commit:

Format: {type}({scope}): {message}

Types: feat, fix, chore, docs, test, refactor, perf, style

Before committing:
1. Run linter: pnpm lint
2. Run tests: pnpm test
3. Check no secrets in diff: git diff --cached

If checks pass:
git add . && git commit -m "{type}({scope}): {message}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### /git:pr {title}
```
Push branch and create pull request:

1. Ensure logs updated (CHANGELOG.md, ERROR_LOG.md if applicable)
2. Push: git push -u origin $(git branch --show-current)
3. Create PR: gh pr create --title "{title}" --body "$(cat <<'EOF'
## Summary
[Bullet points summarizing changes]

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if UI changes)
- [ ] Manual testing completed

## Logs Updated
- [ ] CHANGELOG.md (if user-facing or API changes)
- [ ] ERROR_LOG.md (if bug fixes)

## Design Review (if UI changes)
- [ ] /design:quick-check completed
- [ ] Screenshots attached (1440px)
- [ ] The Intelligent Hive compliance verified

## Checklist
- [ ] Tests added/updated
- [ ] TypeScript strict mode passing
- [ ] Linter passing
- [ ] No secrets in diff
- [ ] Documentation updated

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

4. Display PR URL
```

### Repository Maintenance

#### /repo:scan
```
Scan repository for improvements:

Read:
1. Root CLAUDE.md
2. plan.md
3. CHANGELOG.md
4. ERROR_LOG.md
5. Recent commits (last 10)

Analyze:
- Code quality issues (linting, type errors, test coverage)
- Security concerns (outdated deps, vulnerabilities)
- Performance bottlenecks (slow queries, large bundles)
- Documentation gaps (missing CLAUDE.md, outdated PRDs)
- Technical debt (TODOs, FIXMEs, deprecated code)

Return:
5-10 prioritized improvements with:
- Description
- Rationale
- Estimated effort (S/M/L)
- Priority (High/Medium/Low)
```

#### /repo:deps:update
```
Update dependencies safely:

1. Check for outdated deps: pnpm outdated
2. Identify security vulnerabilities: pnpm audit
3. For each update:
   - Check CHANGELOG for breaking changes
   - Update in dev branch
   - Run tests
   - Document in CHANGELOG.md if risky
4. Create PR with update summary
```

## Reusable Prompt Templates

### Template: Feature Implementation
```
Implement feature "{feature-name}" following EPC workflow:

Phase 1: Explore
1. Read: root CLAUDE.md → {scope}/CLAUDE.md → /docs/prds/{feature}.md
2. Understand: current state, dependencies, acceptance criteria
3. Report: summary of findings

Phase 2: Plan
4. Create test-first plan (Red → Green → Refactor)
5. Identify: files to create/modify, risks, decisions
6. Update plan.md

Phase 3: Code
7. Write failing tests
8. Implement minimum code to pass tests
9. Refactor for quality
10. Repeat for each sub-task

Phase 4: Verify
11. Run: pnpm test, pnpm typecheck, pnpm lint
12. For UI: Run /design:quick-check
13. Update logs (CHANGELOG.md, ERROR_LOG.md)

Phase 5: PR
14. Run /git:commit
15. Run /git:pr
```

### Template: Bug Fix
```
Fix bug: "{bug-description}"

1. Reproduce:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (browser, OS, etc.)

2. Investigate:
   - Read relevant code
   - Identify root cause
   - Check if similar bugs elsewhere

3. Write test:
   - Create failing test that reproduces bug
   - Confirm test fails

4. Implement fix:
   - Minimal code change to fix bug
   - Ensure test passes

5. Verify:
   - Run full test suite
   - Manual testing
   - Check for regressions

6. Document:
   - Update ERROR_LOG.md with fix details
   - Update CHANGELOG.md if user-visible

7. PR:
   - Reference issue number
   - Include reproduction steps and fix explanation
```

### Template: Database Migration
```
Create database migration: "{migration-description}"

1. Plan migration:
   - Identify schema changes
   - Consider backward compatibility
   - Plan data migration if needed
   - Identify rollback strategy

2. Create migration:
   - Use Prisma: pnpm --filter db prisma migrate dev --name {name}
   - Review generated SQL
   - Test on dev database

3. Write data migration (if needed):
   - Create seed script in packages/db/seed/
   - Test with production-like data volume

4. Update code:
   - Update Prisma schema
   - Regenerate Prisma client: pnpm --filter db prisma generate
   - Update TypeScript types

5. Update tests:
   - Update test fixtures
   - Update integration tests

6. Document:
   - Update CHANGELOG.md
   - Document rollback procedure
   - Add migration notes to /docs/architecture/

7. Deploy:
   - Test on staging first
   - Monitor for performance impact
   - Have rollback script ready
```

## Agent Invocation Patterns

### @agent-git-manager
```
Invoke for:
- Complex Git operations (rebase, cherry-pick, conflict resolution)
- Branch management (cleanup old branches)
- Git history analysis (find when bug introduced)
```

### @agent-security-reviewer
```
Invoke for:
- Security audits before major releases
- Reviewing auth/authz implementations
- Analyzing third-party dependencies
- Incident response (security breach investigation)
```

### @agent-design-review
```
Invoke for:
- Comprehensive UI/UX validation before PR merge
- New component review (design system compliance)
- Accessibility audit (WCAG 2.1 AA)
- Responsive design verification
```

### @agent-architecture-review
```
Invoke for:
- Major architecture decisions (new package, service boundary changes)
- Performance optimization proposals
- Scaling strategy review
- Third-party integration design
```

## Usage Notes

- All slash commands should be executed within appropriate context (correct directory, branch, etc.)
- Commands that modify files should always run tests afterward
- Commands that create PRs should ensure logs are updated
- Always follow EPC workflow for non-trivial changes
- Invoke agents proactively for their specialties, not reactively after issues arise
