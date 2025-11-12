# Trato Hive

AI-Native M&A CRM built as a System of Reasoning

## Overview

Trato Hive is an AI-Native M&A CRM that unifies sourcing, pipeline management, and diligence into one verifiable, agentic platform. Unlike traditional "AI-Augmented" CRMs, Trato Hive is built from the ground up with the **citation-first principle**—every AI-generated insight is hyperlinked to its source document.

## Core Principles

1. **Verifiability First** - Every AI output must be hyperlinked to source documents
2. **Unified & Composable** - One platform for entire M&A workflow, API-first
3. **Agentic Orchestration** - AI agents execute multi-step workflows, not just assist

## Architecture

### Hybrid Monorepo Structure
- `apps/` - Deployable applications (web, api)
- `packages/` - Shared libraries (8 packages mapped to 7-Layer Architecture)
- `features/` - Domain modules (5 features mapped to Core Modules)

### 7-Layer Architecture
1. Data Plane - Ingestion & Storage
2. Semantic Layer - Verifiable Fact Layer & Knowledge Graph
3. TIC - Trato Intelligence Core (Reasoning Engine)
4. Agentic Layer - AI Workflow Agents
5. Experience Layer - UI/UX & Generative Output
6. Governance Layer - Security & Audit
7. API Layer - Connectivity

### 5 Core Modules
1. **Command Center** - Dynamic dashboard with conversational AI
2. **Discovery** - AI-Native sourcing and target discovery
3. **Deals** - Interactive Pipeline OS with Deal 360°
4. **Diligence** - AI-Native VDR with automated Q&A
5. **Generator** - Auditable material creation (IC decks, LOIs)

## Design System

**The Intelligent Hive** - A warm, connected, intelligent design language

**Colors:**
- Soft Sand (`#F5EFE7`) - Primary background
- Gold/Honey (`#E2A74A`) - Accents, CTAs, citations
- Charcoal Black (`#1A1A1A`) - Primary text
- Teal Blue (`#2F7E8A`) - AI insights, links

**Typography:**
- Headings: Lora or Playfair Display (serif)
- Body/UI: Inter or Public Sans (sans-serif)

## Getting Started

### Prerequisites
- Node.js 20+ LTS
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+

### Installation

```bash
# Install dependencies
pnpm install

# Start local services (Postgres, Redis)
docker-compose up -d

# Start development servers
pnpm dev
```

### Development

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Documentation

- **Root CLAUDE.md** - Global rules and architecture
- **/docs/PRD.md** - Product requirements
- **/docs/prds/** - Feature-level PRDs
- **/context/design-principles.md** - UX principles
- **/context/style-guide.md** - Design system tokens
- **plan.md** - Current development plan

## Workflow

All development follows the **EPC Loop**:

1. **Explore** - Read CLAUDE.md files, PRDs, code in scope
2. **Plan** - Create test-first plan in plan mode
3. **Code** - Implement with TDD (Red → Green → Refactor)
4. **Verify** - Tests, typecheck, lint, visual checks

## Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS
- Playwright (E2E)

**Backend:**
- Node.js 20+ LTS
- Express.js
- Prisma ORM
- PostgreSQL 15+

**AI/ML:**
- OpenAI GPT-4 (TIC)
- Vector database (Pinecone/Weaviate)

## Security & Compliance

- SOC2 Type II compliant architecture
- GDPR compliant
- AES-256 encryption at rest
- TLS 1.3 in transit
- No training on user data (firm policy)

## License

MIT

## Contributing

See root CLAUDE.md for development guidelines and workflow protocols.
