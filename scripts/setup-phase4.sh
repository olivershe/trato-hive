#!/bin/bash

# Trato Hive - Phase 4 Automated Setup Script
# This script automates what can be automated in Phase 4
# Manual steps (Docker install, API keys) are documented

set -e

echo "=================================================="
echo "Trato Hive - Phase 4 Setup Automation"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check prerequisites
echo -e "${BLUE}[1/6] Checking prerequisites...${NC}"
echo ""

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm not found. Install with: npm install -g pnpm"
  exit 1
fi
echo "✓ pnpm installed ($(pnpm --version))"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Error: Node.js 20+ required. Current: $(node --version)"
  exit 1
fi
echo "✓ Node.js $(node --version)"

echo ""

# Step 2: Create .env file if it doesn't exist
echo -e "${BLUE}[2/6] Setting up environment variables...${NC}"
echo ""

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "✓ .env file created"
  echo ""
  echo -e "${YELLOW}⚠ ACTION REQUIRED: You must now:${NC}"
  echo "  1. Generate secrets and update .env:"
  echo "     openssl rand -base64 32  # NEXTAUTH_SECRET"
  echo "     openssl rand -base64 32  # JWT_SECRET"
  echo "     openssl rand -base64 32  # REFRESH_TOKEN_SECRET"
  echo ""
  echo "  2. Add API keys to .env:"
  echo "     - ANTHROPIC_API_KEY (https://console.anthropic.com/)"
  echo "     - OPENAI_API_KEY (https://platform.openai.com/api-keys)"
  echo ""
  echo "  3. Optional keys (can add later):"
  echo "     - PINECONE_API_KEY (for vector search)"
  echo "     - REDUCTO_API_KEY (for OCR)"
  echo ""
  echo "Press Enter after you've updated .env..."
  read
else
  echo "✓ .env file already exists"
fi

echo ""

# Step 3: Check Docker
echo -e "${BLUE}[3/6] Checking Docker installation...${NC}"
echo ""

if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠ ACTION REQUIRED: Docker not installed${NC}"
  echo ""
  echo "Please install Docker Desktop:"
  echo "  1. Go to: https://www.docker.com/products/docker-desktop/"
  echo "  2. Download Docker Desktop for Mac"
  echo "  3. Install and start Docker Desktop"
  echo "  4. Wait for Docker whale icon in menu bar"
  echo ""
  echo "Press Enter after Docker is installed and running..."
  read

  # Verify Docker after installation
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker still not found. Please check installation."
    exit 1
  fi
fi

echo "✓ Docker installed ($(docker --version))"

# Check Docker daemon
if ! docker ps &> /dev/null; then
  echo -e "${YELLOW}⚠ Docker daemon not running. Please start Docker Desktop.${NC}"
  echo "Press Enter after Docker Desktop is running..."
  read

  if ! docker ps &> /dev/null; then
    echo "Error: Docker daemon still not running."
    exit 1
  fi
fi

echo "✓ Docker daemon running"

echo ""

# Step 4: Start Docker services
echo -e "${BLUE}[4/6] Starting Docker services...${NC}"
echo ""

echo "Starting PostgreSQL, Redis, Neo4j..."
docker compose up -d

echo ""
echo "Waiting for services to become healthy..."
sleep 5

# Wait for health checks (max 60 seconds)
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if docker compose ps | grep -q "healthy.*healthy.*healthy"; then
    echo "✓ All services are healthy"
    break
  fi
  echo -n "."
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
  echo ""
  echo -e "${YELLOW}⚠ Services may still be starting. Check with: docker compose ps${NC}"
fi

echo ""
docker compose ps

echo ""

# Step 5: Install dependencies
echo -e "${BLUE}[5/6] Installing dependencies...${NC}"
echo ""

pnpm install

echo ""
echo "✓ Dependencies installed"

echo ""

# Step 6: Initialize database
echo -e "${BLUE}[6/6] Initializing database...${NC}"
echo ""

echo "Generating Prisma Client..."
pnpm --filter @trato-hive/db db:generate

echo ""
echo "Creating initial migration..."
pnpm --filter @trato-hive/db db:migrate dev --name init

echo ""
echo "✓ Database initialized"

echo ""
echo "=================================================="
echo -e "${GREEN}✓ Phase 4 Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Your environment is ready for development."
echo ""
echo "Next steps:"
echo "  • Run verification: ./scripts/verify-phase4.sh"
echo "  • Start dev servers: pnpm dev"
echo "  • Open Prisma Studio: pnpm --filter @trato-hive/db db:studio"
echo ""
echo "Access services:"
echo "  • Frontend: http://localhost:3000"
echo "  • API: http://localhost:4000"
echo "  • Neo4j Browser: http://localhost:7474 (user: neo4j, pass: dev_password)"
echo "  • Prisma Studio: http://localhost:5555"
echo ""
echo "For troubleshooting, see: /SETUP_GUIDE.md"
echo ""
