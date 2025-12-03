Git & CI Rules

### Git Workflow Management

**The `@git-workflow-manager` Agent:**
All Git operations (branching, commits, merges, rebases, PRs) should be handled by the git-workflow-manager agent to ensure consistency and safety. This agent is invoked proactively for:

- **Branch Operations:** Creating feature/fix/chore branches following naming conventions
- **Commits:** Crafting semantic commit messages with proper type/scope formatting
- **Pre-PR Preparation:** Rebasing on main, running tests, ensuring clean history
- **Conflict Resolution:** Handling merge conflicts during rebases
- **History Cleanup:** Squashing WIP commits, interactive rebases
- **PR Creation:** Final validation and pushing to remote

**When to Invoke:**
```
User signals:
- "I've finished implementing [feature]" → invoke for commit
- "Let's create a PR" → invoke for PR preparation
- "Start new feature [name]" → invoke for branch creation
- "Getting merge conflicts" → invoke for conflict resolution
- "Clean up commits" → invoke for history cleanup
```

**Branching Strategy:**
- `main`: protected branch, requires PR + reviews
- `feature/{slug}`: new features
- `fix/{slug}`: bug fixes
- `chore/{slug}`: maintenance, deps, tooling

**Commit Message Format:**
```
type(scope): brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`
Scopes: `deals`, `discovery`, `diligence`, `generator`, `command-center`, or package names

**Pull Requests:**
- PRs must reference: plan summary, test evidence, updated logs
- PR description must include: "Closes #issue", acceptance criteria checklist
- Required checks: tests pass, lint pass, typecheck pass, security scan pass
- For UI PRs: attach 1440px screenshots and design review decision

**Safety Rules (enforced by git-workflow-manager):**
- Backup branch created before destructive operations (rebase, force push, hard reset)
- Secret scanning on all commits (API keys, tokens, credentials)
- No .env files or sensitive config in commits
- Tests must pass before push
- No force push to main
- No rebasing public/shared branches

**CI Pipeline (.github/workflows/ci.yml):**
1. Install dependencies
2. Run typecheck across all packages
3. Run linter
4. Run unit tests with coverage
5. Run integration tests
6. Security scan (npm audit, Snyk)
7. For apps/web changes: Playwright visual regression