# Trato Hive - Phase 4 Environment Setup Guide

**Last Updated:** November 28, 2025
**Time Required:** ~2 hours
**Status:** Ready to Execute

---

## Overview

This guide walks through Phase 4: Environment Setup - the final setup phase before development begins. After completing this, the project will be 100% ready for implementation.

**What You'll Set Up:**
1. Environment variables (.env file)
2. Docker services (PostgreSQL, Redis, Neo4j)
3. Database initialization (Prisma migrations)
4. Verification that all services are running

---

## Prerequisites

- ✅ Node.js 20+ installed
- ✅ pnpm installed (`npm install -g pnpm`)
- ⏸️ Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop/))
- ⏸️ Git installed

---

## Step 1: Environment Variables Setup (30 minutes)

### 1.1 Copy the Example File

```bash
cd /Users/ollieshewan/Desktop/Trato\ Hive
cp .env.example .env
```

### 1.2 Generate Secrets

Generate three secure secrets for authentication:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -base64 32
```

### 1.3 Edit .env File

Open `.env` and update the following **REQUIRED** variables:

```bash
# Replace these three with the generated secrets above
NEXTAUTH_SECRET="<paste-first-generated-secret>"
JWT_SECRET="<paste-second-generated-secret>"
REFRESH_TOKEN_SECRET="<paste-third-generated-secret>"

# Add your AI API keys (get from provider websites)
ANTHROPIC_API_KEY="sk-ant-..."  # https://console.anthropic.com/
OPENAI_API_KEY="sk-..."         # https://platform.openai.com/api-keys

# Add Pinecone API key (for vector search)
PINECONE_API_KEY="..."          # https://app.pinecone.io/

# Add Reducto AI key (for OCR)
REDUCTO_API_KEY="..."           # https://reducto.ai/
```

### 1.4 Optional Variables (Can Skip for Now)

These can be added later when needed:

- **AWS S3:** Only needed when testing document uploads
- **OAuth Providers:** Only needed for Google/Microsoft login
- **Kimi K2:** Optional secondary LLM (can skip)

### 1.5 Verify .env File

Check that `.env` exists and has the required secrets:

```bash
cat .env | grep -E "NEXTAUTH_SECRET|JWT_SECRET|REFRESH_TOKEN_SECRET|ANTHROPIC_API_KEY"
```

You should see all four variables with actual values (not "your-..." placeholders).

---

## Step 2: Install Docker Desktop (15 minutes)

### 2.1 Download and Install

1. Go to https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Mac (Apple Silicon or Intel)
3. Install the application
4. Open Docker Desktop and wait for it to start (Docker whale icon in menu bar)

### 2.2 Verify Installation

```bash
docker --version
# Should output: Docker version 24.x.x or higher

docker compose version
# Should output: Docker Compose version v2.x.x or higher
```

---

## Step 3: Start Docker Services (10 minutes)

### 3.1 Start All Services

```bash
cd /Users/ollieshewan/Desktop/Trato\ Hive

# Start PostgreSQL, Redis, Neo4j in detached mode
docker compose up -d
```

Expected output:
```
✔ Network trato-hive_trato-hive     Created
✔ Container trato-hive-postgres     Started
✔ Container trato-hive-redis        Started
✔ Container trato-hive-neo4j        Started
```

### 3.2 Verify All Services Are Running

```bash
docker compose ps
```

Expected output (all should show "Up" status):
```
NAME                  STATUS          PORTS
trato-hive-postgres   Up (healthy)    0.0.0.0:5432->5432/tcp
trato-hive-redis      Up (healthy)    0.0.0.0:6379->6379/tcp
trato-hive-neo4j      Up (healthy)    0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
```

### 3.3 Check Service Logs (Optional)

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs postgres
docker compose logs redis
docker compose logs neo4j
```

Press `Ctrl+C` to stop following logs.

### 3.4 Test Service Connections

**Test PostgreSQL:**
```bash
docker exec -it trato-hive-postgres psql -U trato -d trato_hive -c "SELECT version();"
```

**Test Redis:**
```bash
docker exec -it trato-hive-redis redis-cli ping
# Should return: PONG
```

**Test Neo4j:**
Open browser and navigate to:
- http://localhost:7474
- Login: `neo4j` / `dev_password`
- Should see Neo4j Browser interface

---

## Step 4: Database Initialization (45 minutes)

### 4.1 Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for all packages and apps.

### 4.2 Generate Prisma Client

```bash
# Generate Prisma client from schema
pnpm --filter @trato-hive/db db:generate
```

Expected output:
```
✔ Generated Prisma Client (v6.x.x)
```

### 4.3 Create Initial Migration

```bash
# Create and apply the initial database migration
pnpm --filter @trato-hive/db db:migrate dev --name init
```

This will:
1. Create the migration SQL file in `packages/db/prisma/migrations/`
2. Apply the migration to create all 7 tables
3. Regenerate Prisma Client

Expected tables created:
- ✅ User
- ✅ Firm
- ✅ Deal
- ✅ Company
- ✅ Document
- ✅ Fact
- ✅ AuditLog

### 4.4 Verify Database Schema

**Option 1: Using Prisma Studio (GUI)**

```bash
pnpm --filter @trato-hive/db db:studio
```

This opens a browser at http://localhost:5555 where you can:
- View all tables
- See the schema structure
- Add test data manually (optional)

**Option 2: Using psql (CLI)**

```bash
docker exec -it trato-hive-postgres psql -U trato -d trato_hive -c "\dt"
```

Should list all 7 tables:
```
             List of relations
 Schema |    Name     | Type  | Owner
--------+-------------+-------+-------
 public | AuditLog    | table | trato
 public | Company     | table | trato
 public | Deal        | table | trato
 public | Document    | table | trato
 public | Fact        | table | trato
 public | Firm        | table | trato
 public | User        | table | trato
```

### 4.5 Seed Database (Optional)

Create seed data for testing:

```bash
# This will be implemented later in Phase 6
# For now, you can manually add test data via Prisma Studio
```

---

## Step 5: Verification Checklist

Run through this checklist to ensure everything is set up correctly:

### 5.1 Environment Variables
- [x] `.env` file exists
- [ ] All REQUIRED variables have real values (not placeholders)
- [ ] NEXTAUTH_SECRET is a 32+ character random string
- [ ] JWT_SECRET is a 32+ character random string
- [ ] ANTHROPIC_API_KEY starts with `sk-ant-`
- [ ] OPENAI_API_KEY starts with `sk-`

### 5.2 Docker Services
- [ ] Docker Desktop is running
- [ ] `docker compose ps` shows all 3 services as "Up (healthy)"
- [ ] PostgreSQL accessible on localhost:5432
- [ ] Redis accessible on localhost:6379
- [ ] Neo4j accessible on localhost:7474 and localhost:7687

### 5.3 Database
- [ ] Prisma Client generated successfully
- [ ] Initial migration applied (all 7 tables created)
- [ ] Prisma Studio opens without errors
- [ ] Can view tables in Prisma Studio or psql

### 5.4 Project Dependencies
- [ ] `pnpm install` completed without errors
- [ ] All workspace packages linked correctly
- [ ] TypeScript configuration valid

---

## Step 6: Test the Setup (Optional)

### 6.1 Build All Packages

```bash
# Build all packages to verify TypeScript compilation
pnpm build
```

This should compile without errors (warnings are okay).

### 6.2 Run Type Checking

```bash
# Check TypeScript across all packages
pnpm typecheck
```

### 6.3 Run Linting

```bash
# Lint all code
pnpm lint
```

---

## Troubleshooting

### Issue: Docker Compose Not Found

**Symptom:** `command not found: docker-compose`

**Solution:**
1. Install Docker Desktop (see Step 2)
2. Or use `docker compose` (without hyphen) - new syntax
3. Update to latest Docker Desktop version

### Issue: PostgreSQL Connection Refused

**Symptom:** `ECONNREFUSED localhost:5432`

**Solution:**
```bash
# Check if PostgreSQL container is running
docker compose ps

# If not running, start it
docker compose up -d postgres

# Check logs for errors
docker compose logs postgres
```

### Issue: Prisma Migration Fails

**Symptom:** `P1001: Can't reach database server`

**Solution:**
1. Verify DATABASE_URL in `.env` matches docker-compose.yml credentials
2. Check PostgreSQL is running: `docker compose ps`
3. Test connection: `docker exec -it trato-hive-postgres psql -U trato -d trato_hive`

### Issue: Port Already in Use

**Symptom:** `Error: bind: address already in use`

**Solution:**
```bash
# Find process using the port (e.g., 5432)
lsof -i :5432

# Kill the process or change the port in docker-compose.yml
docker compose down
# Edit docker-compose.yml to use different port
docker compose up -d
```

### Issue: Missing API Keys

**Symptom:** Application runs but API calls fail

**Solution:**
1. Check `.env` has real API keys (not placeholders)
2. Verify keys are valid (test in provider console)
3. Restart application after updating `.env`

---

## Next Steps

Once all steps are complete and verification passes:

✅ **Phase 4 Complete!**

You're now ready for:

### Phase 6: Foundation Packages Implementation (40 hours)
- Implement `packages/shared` (types, validators, utilities)
- Implement `packages/db` seed scripts
- Implement `packages/auth` (NextAuth configuration)
- See PROJECT_STATUS.md for detailed breakdown

### Quick Start Commands

```bash
# Start development servers (after Phase 6+)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Access services
# - Frontend: http://localhost:3000
# - API: http://localhost:4000
# - Prisma Studio: pnpm --filter @trato-hive/db db:studio
# - Neo4j Browser: http://localhost:7474
```

---

## Useful Commands Reference

### Docker

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# Remove all data (DANGEROUS)
docker compose down -v
```

### Database

```bash
# Generate Prisma Client
pnpm --filter @trato-hive/db db:generate

# Create migration
pnpm --filter @trato-hive/db db:migrate dev --name <name>

# Apply migrations (production)
pnpm --filter @trato-hive/db db:migrate deploy

# Open Prisma Studio
pnpm --filter @trato-hive/db db:studio

# Reset database (DANGEROUS)
pnpm --filter @trato-hive/db db:migrate reset
```

### Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

---

**Setup Guide Complete!**

For questions or issues, refer to:
- Root CLAUDE.md for project rules
- PROJECT_STATUS.md for progress tracking
- Individual package CLAUDE.md files for specific guidance
