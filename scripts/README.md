# Trato Hive - Setup & Automation Scripts

This directory contains automation scripts to streamline Phase 4 environment setup and ongoing development workflows.

## Phase 4 Setup Scripts

### 🚀 `setup-phase4.sh` - Automated Environment Setup

**Purpose:** Interactive script that automates the entire Phase 4 environment setup process.

**What it does:**
1. Checks prerequisites (Node.js 20+, pnpm installed)
2. Creates `.env` from `.env.example` (if not exists)
3. Prompts you to add secrets and API keys
4. Verifies Docker Desktop installation (prompts to install if missing)
5. Starts all Docker services (PostgreSQL, Redis, Neo4j)
6. Installs all workspace dependencies via `pnpm install`
7. Generates Prisma Client
8. Runs initial database migration
9. Provides success summary with next steps

**Usage:**
```bash
# Make executable (if not already)
chmod +x scripts/setup-phase4.sh

# Run the setup
./scripts/setup-phase4.sh
```

**When to use:**
- First-time environment setup
- After cloning the repository on a new machine
- When resetting your local environment

**What you'll need:**
- Docker Desktop (will prompt you to install if missing)
- API keys ready:
  - Anthropic API key (https://console.anthropic.com/)
  - OpenAI API key (https://platform.openai.com/api-keys)
  - Pinecone API key (optional for MVP - https://app.pinecone.io/)
  - Reducto API key (optional for OCR - https://reducto.ai/)

---

### ✅ `verify-phase4.sh` - Environment Verification

**Purpose:** Comprehensive verification script that checks if Phase 4 setup is complete and correct.

**What it checks:**
1. **Environment Variables:**
   - `.env` file exists
   - All required secrets set (NEXTAUTH_SECRET, JWT_SECRET, REFRESH_TOKEN_SECRET)
   - API keys present (Anthropic, OpenAI)
   - Optional keys status (Pinecone, Reducto)

2. **Docker Services:**
   - Docker installed and version
   - Docker daemon running
   - PostgreSQL container running and healthy
   - Redis container running and healthy
   - Neo4j container running and healthy

3. **Database:**
   - Prisma Client generated
   - Migrations exist and applied
   - All 7 tables created (User, Firm, Deal, Company, Document, Fact, AuditLog)

4. **Dependencies:**
   - Root dependencies installed
   - All workspace packages installed

**Usage:**
```bash
# Make executable (if not already)
chmod +x scripts/verify-phase4.sh

# Run verification
./scripts/verify-phase4.sh
```

**Exit codes:**
- `0` - All checks passed ✓
- `1` - Some checks failed ✗

**Output:**
- Color-coded results:
  - 🟢 Green `✓ PASS` - Check succeeded
  - 🔴 Red `✗ FAIL` - Check failed (requires action)
  - 🟡 Yellow `⚠ WARN` - Warning (optional items)

**When to use:**
- After running `setup-phase4.sh`
- After manually following `/SETUP_GUIDE.md`
- Before starting development work
- When troubleshooting environment issues
- As part of CI/CD pipeline (future)

---

## Manual Setup Alternative

If you prefer manual control, follow the comprehensive step-by-step guide:

📖 **See:** `/SETUP_GUIDE.md` (500+ lines)

Then verify with:
```bash
./scripts/verify-phase4.sh
```

---

## Common Issues & Troubleshooting

### "Docker not found"
**Solution:** Install Docker Desktop from https://www.docker.com/products/docker-desktop/

### "Docker daemon not running"
**Solution:** Start Docker Desktop application, wait for whale icon in menu bar

### "Port already in use"
**Solution:**
```bash
# Find process using the port (e.g., 5432)
lsof -i :5432

# Stop Docker services and restart
docker compose down
docker compose up -d
```

### "Prisma migration failed"
**Solution:**
```bash
# Check DATABASE_URL in .env matches docker-compose.yml
# Verify PostgreSQL is running
docker compose ps

# Reset and retry
pnpm --filter @trato-hive/db db:migrate reset
pnpm --filter @trato-hive/db db:migrate dev --name init
```

### "Missing API keys"
**Solution:** Obtain keys from provider websites and update `.env`:
- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/api-keys
- Pinecone: https://app.pinecone.io/ (optional)
- Reducto: https://reducto.ai/ (optional)

---

## Next Steps After Phase 4

Once `verify-phase4.sh` shows all green checks:

1. **Start development servers:**
   ```bash
   pnpm dev
   ```

2. **Access services:**
   - Frontend: http://localhost:3000
   - API: http://localhost:4000
   - Prisma Studio: http://localhost:5555 (run: `pnpm --filter @trato-hive/db db:studio`)
   - Neo4j Browser: http://localhost:7474 (login: neo4j/dev_password)

3. **Begin Phase 6:** Foundation Packages Implementation (40 hours)
   - See `/PROJECT_STATUS.md` for detailed breakdown

---

## Script Maintenance

**When to update these scripts:**
- New environment variables added to `.env.example`
- New Docker services added to `docker-compose.yml`
- New database migrations created
- New dependencies added to workspace

**How to update:**
1. Edit the relevant script (`setup-phase4.sh` or `verify-phase4.sh`)
2. Test the changes locally
3. Update this README if behavior changes
4. Commit with semantic message: `chore(scripts): update Phase 4 automation for <reason>`

---

**For detailed setup instructions, see:** `/SETUP_GUIDE.md`
**For project status and roadmap, see:** `/PROJECT_STATUS.md`
**For architecture and rules, see:** `/CLAUDE.md`
