#!/bin/bash

# Trato Hive - Phase 4 Environment Setup Verification Script
# Run this script to check Phase 4 completion status

set -e

echo "=================================================="
echo "Trato Hive - Phase 4 Setup Verification"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
all_checks_passed=true

# Helper function to print status
check_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    all_checks_passed=false
  fi
}

# Helper function for warnings
check_warning() {
  echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

echo "=== 1. ENVIRONMENT VARIABLES ==="
echo ""

# Check .env file exists
if [ -f .env ]; then
  check_status 0 ".env file exists"

  # Check for required secrets
  if grep -q "NEXTAUTH_SECRET=\".*\"" .env && ! grep -q "generate-a-secret" .env; then
    check_status 0 "NEXTAUTH_SECRET is set"
  else
    check_status 1 "NEXTAUTH_SECRET needs to be generated (run: openssl rand -base64 32)"
  fi

  if grep -q "JWT_SECRET=\".*\"" .env && ! grep -q "generate-another-secret" .env; then
    check_status 0 "JWT_SECRET is set"
  else
    check_status 1 "JWT_SECRET needs to be generated (run: openssl rand -base64 32)"
  fi

  if grep -q "REFRESH_TOKEN_SECRET=\".*\"" .env && ! grep -q "generate-third-secret" .env; then
    check_status 0 "REFRESH_TOKEN_SECRET is set"
  else
    check_status 1 "REFRESH_TOKEN_SECRET needs to be generated (run: openssl rand -base64 32)"
  fi

  # Check for API keys
  if grep -q "ANTHROPIC_API_KEY=\"sk-ant-" .env; then
    check_status 0 "ANTHROPIC_API_KEY is set"
  else
    check_status 1 "ANTHROPIC_API_KEY needs to be added (get from: https://console.anthropic.com/)"
  fi

  if grep -q "OPENAI_API_KEY=\"sk-" .env; then
    check_status 0 "OPENAI_API_KEY is set"
  else
    check_status 1 "OPENAI_API_KEY needs to be added (get from: https://platform.openai.com/api-keys)"
  fi

  # Optional keys - just warnings
  if ! grep -q "PINECONE_API_KEY=\".*\"" .env || grep -q "your-pinecone-api-key" .env; then
    check_warning "PINECONE_API_KEY not set (optional for MVP, required for POC)"
  fi

  if ! grep -q "REDUCTO_API_KEY=\".*\"" .env || grep -q "your-reducto-api-key" .env; then
    check_warning "REDUCTO_API_KEY not set (optional for MVP, required for OCR)"
  fi

else
  check_status 1 ".env file not found (run: cp .env.example .env)"
fi

echo ""
echo "=== 2. DOCKER SERVICES ==="
echo ""

# Check Docker installation
if command -v docker &> /dev/null; then
  check_status 0 "Docker installed ($(docker --version))"

  # Check Docker daemon is running
  if docker ps &> /dev/null; then
    check_status 0 "Docker daemon is running"

    # Check if containers are running
    if docker compose ps 2>/dev/null | grep -q "trato-hive-postgres.*Up"; then
      check_status 0 "PostgreSQL container is running"
    else
      check_status 1 "PostgreSQL container not running (run: docker compose up -d)"
    fi

    if docker compose ps 2>/dev/null | grep -q "trato-hive-redis.*Up"; then
      check_status 0 "Redis container is running"
    else
      check_status 1 "Redis container not running (run: docker compose up -d)"
    fi

    if docker compose ps 2>/dev/null | grep -q "trato-hive-neo4j.*Up"; then
      check_status 0 "Neo4j container is running"
    else
      check_status 1 "Neo4j container not running (run: docker compose up -d)"
    fi

  else
    check_status 1 "Docker daemon not running (start Docker Desktop)"
  fi

else
  check_status 1 "Docker not installed (download from: https://www.docker.com/products/docker-desktop/)"
fi

echo ""
echo "=== 3. DATABASE INITIALIZATION ==="
echo ""

# Check if Prisma Client is generated
if [ -d "packages/db/node_modules/.prisma/client" ] || [ -d "node_modules/.prisma/client" ]; then
  check_status 0 "Prisma Client generated"
else
  check_status 1 "Prisma Client not generated (run: pnpm --filter @trato-hive/db db:generate)"
fi

# Check if migrations exist
if [ -d "packages/db/prisma/migrations" ] && [ "$(ls -A packages/db/prisma/migrations)" ]; then
  check_status 0 "Database migrations exist"

  # Count migration files
  migration_count=$(find packages/db/prisma/migrations -type d -mindepth 1 | wc -l | tr -d ' ')
  echo "   Found $migration_count migration(s)"
else
  check_status 1 "No migrations found (run: pnpm --filter @trato-hive/db db:migrate dev --name init)"
fi

echo ""
echo "=== 4. DEPENDENCIES ==="
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
  check_status 0 "Root dependencies installed"
else
  check_status 1 "Root dependencies not installed (run: pnpm install)"
fi

# Check workspace packages
for pkg in db shared auth data-plane semantic-layer ai-core agents ui; do
  if [ -d "packages/$pkg/node_modules" ] || [ -d "node_modules/@trato-hive/$pkg" ]; then
    check_status 0 "Package @trato-hive/$pkg dependencies installed"
  else
    check_warning "Package @trato-hive/$pkg may need dependencies (run: pnpm install)"
  fi
done

echo ""
echo "=================================================="
echo "VERIFICATION SUMMARY"
echo "=================================================="
echo ""

if [ "$all_checks_passed" = true ]; then
  echo -e "${GREEN}✓ All critical checks passed!${NC}"
  echo ""
  echo "Phase 4 setup is complete. You can now proceed to Phase 6: Foundation Packages Implementation."
  echo ""
  echo "Next steps:"
  echo "  1. Start development servers: pnpm dev"
  echo "  2. Open Prisma Studio: pnpm --filter @trato-hive/db db:studio"
  echo "  3. Access services:"
  echo "     - Frontend: http://localhost:3000"
  echo "     - API: http://localhost:4000"
  echo "     - Neo4j Browser: http://localhost:7474"
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Please address the issues above.${NC}"
  echo ""
  echo "Quick fix commands:"
  echo "  - Copy .env: cp .env.example .env"
  echo "  - Generate secrets: openssl rand -base64 32"
  echo "  - Install Docker: https://www.docker.com/products/docker-desktop/"
  echo "  - Start services: docker compose up -d"
  echo "  - Install deps: pnpm install"
  echo "  - Generate Prisma: pnpm --filter @trato-hive/db db:generate"
  echo "  - Run migrations: pnpm --filter @trato-hive/db db:migrate dev --name init"
  echo ""
  echo "For detailed instructions, see: /SETUP_GUIDE.md"
  exit 1
fi
