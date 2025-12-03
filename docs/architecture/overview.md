## 2. Product Context

Trato Hive is an AI-Native M&A CRM built as a "System of Reasoning" not an "AI-Augmented" database.

**Core Principles:**
1. **Verifiability First:** Every AI output must be hyperlinked to source documents (citation-first)
2. **Unified & Composable:** Sourcing + Pipeline + Diligence in one workflow, API-first
3. **Agentic Orchestration:** AI agents execute and orchestrate complex multi-step workflows

**5 Core Modules:**
- Module 1: Hive Command Center (dynamic dashboard)
- Module 2: Discovery (AI-Native sourcing)
- Module 3: Deals (Interactive Pipeline OS)
- Module 4: Diligence Room (AI-Native VDR)
- Module 5: Generator (Auditable material creation)

**7-Layer Architecture:**
1. Data Plane: Ingestion & Storage
2. Semantic Layer: Verifiable Fact Layer & Knowledge Graph
3. TIC: Trato Intelligence Core (Reasoning Engine)
4. Agentic Layer: AI Workflow Agents
5. Experience Layer: UI/UX & Generative Output
6. Governance Layer: Security & Audit
7. API Layer: Connectivity

## 3. Architecture Overview

**Hybrid Monorepo Structure:**
- `apps/`: Deployable applications (web frontend, api backend)
- `packages/`: Shared libraries mapped to 7-Layer Architecture
- `features/`: Domain modules mapped to 5 Core Modules

**Package-to-Architecture Mapping:**
- `packages/data-plane/` → Layer 1: Data Plane
- `packages/semantic-layer/` → Layer 2: Semantic Layer
- `packages/ai-core/` → Layer 3: TIC Core
- `packages/agents/` → Layer 4: Agentic Layer
- `apps/web/` → Layer 5: Experience Layer (Frontend)
- `apps/api/` → Layer 5: Experience Layer (Backend)
- Auth, audit, security distributed across → Layer 6: Governance Layer
- API routes in `apps/api/` → Layer 7: API Layer

**Feature-to-Module Mapping:**
- `features/command-center/` → Module 1
- `features/discovery/` → Module 2
- `features/deals/` → Module 3
- `features/diligence/` → Module 4
- `features/generator/` → Module 5

**Data Ownership:**
- Deals: owned by `features/deals/`
- Companies: owned by `features/discovery/`
- Documents: owned by `packages/data-plane/`
- Facts: owned by `packages/semantic-layer/`
- Users/Auth: owned by `packages/auth/`

**Service Boundaries:**
- Each feature exposes clear interfaces (services, routes, components)
- No direct database access from features; use package abstractions
- Cross-feature communication via events or shared packages