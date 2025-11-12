# Trato Hive - Quick Start Guide

## 🚀 First Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker services (Postgres, Redis)
docker-compose up -d

# 3. Start development servers
pnpm dev
```

## 📖 Essential Reading Order

1. **README.md** - Project overview
2. **CLAUDE.md** - Root governance (MUST READ FIRST for any development)
3. **context/design-principles.md** - UX principles
4. **context/style-guide.md** - The Intelligent Hive design system
5. **docs/PRD.md** - Product requirements
6. **plan.md** - Current development plan

## 🎯 Development Workflow (EPC Loop)

### 1. Explore
```bash
# Read relevant files:
# - Root CLAUDE.md
# - Local CLAUDE.md (app/package/feature)
# - Relevant PRD
# - Code in scope
```

### 2. Plan
```bash
claude --permission-mode plan
# Or use: /plan {task-description}
```

### 3. Code (TDD)
```bash
# Red: Write failing test
pnpm test

# Green: Implement minimum code to pass
pnpm test

# Refactor: Improve code quality
pnpm lint && pnpm typecheck
```

### 4. Verify
```bash
# Run all checks
pnpm test
pnpm typecheck
pnpm lint

# For UI changes:
# /design:quick-check {component}
```

## 🛠️ Common Commands

### Development
```bash
pnpm dev                    # Start all dev servers
pnpm --filter web dev       # Start web only
pnpm --filter api dev       # Start API only
```

### Testing
```bash
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm --filter web test:e2e  # Run E2E tests
```

### Quality Checks
```bash
pnpm typecheck              # TypeScript check
pnpm lint                   # Run ESLint
pnpm lint:fix               # Auto-fix issues
pnpm format                 # Format with Prettier
```

### Docker
```bash
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
```

## 📝 Slash Commands (via Claude Code)

### Planning
- `/plan {task}` - Create implementation plan
- `/plan:session {duration} {feature}` - Prepare coding session

### Logging
- `/log:changelog {summary}` - Update CHANGELOG.md
- `/log:error {symptom}` - Update ERROR_LOG.md

### Design
- `/design:quick-check {scope}` - Run visual check
- `/design:review {component}` - Comprehensive review
- `/design:tokens` - Show design system tokens

### Testing
- `/test:unit {scope}` - Run unit tests
- `/test:e2e {flow}` - Run E2E tests

### Git
- `/git:branch {type}/{slug}` - Create branch
- `/git:commit {type} {scope} {message}` - Semantic commit
- `/git:pr {title}` - Create pull request

### Review
- `/review:architecture {component}` - Architecture review
- `/review:security {scope}` - Security audit

## 🤖 Specialist Agents

Invoke with `@agent-{name}`:

- **@agent-git-manager** - Git operations, branch management
- **@agent-security-reviewer** - Security audits, compliance
- **@agent-design-review** - UI/UX compliance, accessibility
- **@agent-architecture-review** - 7-Layer Architecture validation

## 🎨 Design System Quick Reference

### Colors (The Intelligent Hive)
```css
Soft Sand:      #F5EFE7  /* Background */
Gold/Honey:     #E2A74A  /* Accents, CTAs, Citations */
Charcoal Black: #1A1A1A  /* Text */
Teal Blue:      #2F7E8A  /* AI insights, Links */
```

### Typography
```css
Headings: font-family: 'Lora', serif;
Body/UI:  font-family: 'Inter', sans-serif;
```

### Spacing (4px base)
```css
space-2: 8px   /* Button padding */
space-4: 16px  /* Card padding */
space-6: 24px  /* Section padding */
space-8: 32px  /* Large spacing */
```

### Border Radius (8px minimum)
```css
radius-md: 8px   /* Default */
radius-lg: 12px  /* Panels */
```

## 📦 Package Architecture

### 7-Layer Mapping
1. **Layer 1** - `packages/data-plane/` (Ingestion)
2. **Layer 2** - `packages/semantic-layer/` (Facts, Knowledge Graph)
3. **Layer 3** - `packages/ai-core/` (TIC Reasoning)
4. **Layer 4** - `packages/agents/` (Agentic Orchestration)
5. **Layer 5** - `apps/web/`, `apps/api/` (Experience)
6. **Layer 6** - `packages/auth/`, `packages/db/` (Governance)
7. **Layer 7** - `apps/api/routes/` (API)

### 5 Feature Modules
1. **Module 1** - `features/command-center/` (Dashboard)
2. **Module 2** - `features/discovery/` (Sourcing)
3. **Module 3** - `features/deals/` (Pipeline OS)
4. **Module 4** - `features/diligence/` (VDR)
5. **Module 5** - `features/generator/` (IC Decks)

## ⚠️ Non-Negotiables

### Security
- ✅ No secrets in code (use .env)
- ✅ All inputs validated (Zod schemas)
- ✅ JWT in httpOnly cookies (not localStorage)
- ✅ Row-level security (firmId checks)

### Code Quality
- ✅ No `any` types (use `unknown`)
- ✅ Tests required (>=80% coverage)
- ✅ TypeScript strict mode
- ✅ ESLint passing

### Design
- ✅ Use design tokens only (no custom colors)
- ✅ 8px minimum border-radius
- ✅ Citations always in Teal Blue with underline
- ✅ WCAG 2.1 AA compliance

### Workflow
- ✅ Plan mode for non-trivial tasks
- ✅ TDD: Red → Green → Refactor
- ✅ Update CHANGELOG for user-facing changes
- ✅ Update ERROR_LOG for bugs

## 📂 Key File Locations

```
CLAUDE.md                           # Root governance
.claude/context.md                  # Mission statement
.claude/rules.md                    # Hard guardrails
.claude/prompts.md                  # Slash commands

context/design-principles.md        # UX principles
context/style-guide.md              # Design system

docs/PRD.md                         # Root PRD
docs/prds/{feature}.md              # Feature PRDs
docs/architecture/                  # Architecture docs

plan.md                             # Development plan
CHANGELOG.md                        # User-visible changes
ERROR_LOG.md                        # Error tracking
```

## 🐛 Troubleshooting

### Docker services not starting
```bash
docker-compose down
docker-compose up -d
docker-compose ps  # Check status
```

### TypeScript errors
```bash
pnpm typecheck              # Check errors
# Fix issues in code
pnpm typecheck              # Verify fixed
```

### Tests failing
```bash
pnpm test                   # See failures
# Fix code
pnpm test                   # Verify fixed
```

### Linting errors
```bash
pnpm lint                   # Check errors
pnpm lint:fix               # Auto-fix
pnpm format                 # Format code
```

## 📚 Documentation Structure

- **Root CLAUDE.md** → Global rules (read FIRST)
- **App CLAUDE.md** → App-specific rules (web, api)
- **Package CLAUDE.md** → Package rules (ui, db, auth, etc.)
- **Feature CLAUDE.md** → Feature boundaries (deals, diligence, etc.)

**Reading Order:**
Root → Local → PRD → Code

## 🎯 First Task Suggestions

1. **Fill PRDs** - Complete product requirements documentation
2. **Set up packages/shared** - Types, validators, constants
3. **Set up packages/db** - Prisma schemas and migrations
4. **Set up packages/ui** - Design system components
5. **Implement features/deals** - Core CRM functionality

## 💡 Pro Tips

- Always invoke specialist agents for their domain
- Use `/design:quick-check` after every UI change
- Keep PRs small (<500 lines)
- Update logs immediately (don't batch)
- Run tests before committing
- Follow citation-first principle religiously

## 🔗 Quick Links

- [Claude Code Docs](https://docs.claude.com/claude-code)
- [Playbook](./claude_code_2025_solo_dev_playbook_cli_plan_mode_claude.md)
- [Product Spec](./Trato%20Hive%20Product%20%26%20Design%20Specification.md)
- [Setup Complete](./PROJECT_SETUP_COMPLETE.md)

---

**Ready to code!** Start with `/plan {your-first-task}`
