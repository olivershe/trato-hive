# Trato Hive: Project Context

## One-Screen Mission Statement

Trato Hive is an AI-Native M&A CRM that transforms how private equity firms, investment banks, and corporate development teams manage their deal workflows. Unlike traditional "AI-Augmented" CRMs that bolt AI features onto databases, Trato Hive is built from the ground up as a **System of Reasoning**—where every AI-generated insight is verifiable, traceable, and hyperlinked to its source.

## The Core Problem

M&A professionals today face:
- **Fragmentation:** Juggling separate tools for sourcing (Grata), pipeline management (DealCloud), diligence (Liquid Acquire), and reporting (manual PowerPoint decks)
- **Lack of Verifiability:** AI tools hallucinate facts without audit trails, creating liability in fiduciary contexts
- **Manual Overhead:** 60% of time spent on data entry, document parsing, and Q&A instead of strategic judgment

## Our Solution: The Citation-First Principle

Every number, claim, or AI-generated insight in Trato Hive is **hyperlinked to its source document**. Click an EBITDA figure → see the exact page and highlighted text from the CIM. This isn't a footnote—it's the product's killer feature, enabling fiduciary-grade confidence in AI outputs.

## Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS (The Intelligent Hive design system)
- React Hook Form + Zod validation
- Playwright (E2E testing)

**Backend:**
- Node.js 20+ LTS
- Express.js
- TypeScript (strict mode)
- PostgreSQL 15+ (Prisma ORM)
- Redis (caching)
- Vector database (Pinecone/Weaviate for embeddings)

**AI/ML:**
- OpenAI GPT-4 (TIC reasoning engine)
- OpenAI ada-002 (embeddings)
- Custom citation extraction & linking

**Infrastructure:**
- Docker (local development)
- AWS S3 (document storage)
- SOC2 Type II compliant architecture
- Multi-tenant SaaS with single-tenant deployment option

## Primary User Flows

### 1. Discovery → Deal Creation (Module 2 → 3)
User searches "UK SaaS companies, 10-50 employees, >20% YoY growth, logistics focus" → AI returns target list → User adds target to pipeline as new deal

### 2. VDR Ingestion → Automated Q&A (Module 4)
User uploads seller's data room (100+ PDFs) → AI OCRs, indexes, builds Verifiable Fact Layer → Diligence team asks questions → AI suggests answers with source citations → Analyst reviews and approves

### 3. Deal 360° → IC Deck Generation (Module 3 → 5)
User views deal in Pipeline → Clicks "Deal 360°" → Reviews Verifiable Fact Sheet (all numbers hyperlinked) → Clicks "Generator" → AI creates 20-slide IC deck with golden citations → User presents to Investment Committee with full traceability

### 4. Command Center (Module 1 - Daily Entry Point)
User logs in → Lands on dashboard → Sees AI-generated "My Tasks" (e.g., "Review 3 new risks flagged in Project Sky") → Uses conversational AI bar to query "What's the latest EBITDA for Project Sky?" → Gets instant, cited answer

## Intended Users

**Primary:**
- Private Equity: Associates, VPs, Partners (deal execution and IC prep)
- Investment Banks: Analysts, Associates (sell-side and buy-side advisory)
- Corporate Development: M&A teams (strategic acquisitions)

**Secondary:**
- Legal teams: Diligence Q&A management
- Consultants: Market research and competitor analysis

## Success Criteria

**User Adoption:**
- 80% of users active weekly
- 50% use AI features daily (conversational AI, automated Q&A, citations)

**Efficiency Gains:**
- 40% reduction in IC deck generation time
- 60% reduction in diligence Q&A turnaround time
- 30% increase in deal pipeline velocity

**Quality:**
- 95% citation accuracy (verified by users)
- <5% AI hallucination rate (measured by user corrections)

## Competitive Positioning

- **vs. DealCloud:** We add AI-native sourcing, automated diligence, and verifiable fact generation
- **vs. Grata:** We integrate sourcing into full pipeline + diligence workflow
- **vs. Liquid Acquire:** We unify VDR with CRM, plus auditable material generation
- **vs. "AI Copilots":** We enforce citation-first verifiability, not just assistance

## Project Values

1. **Verifiability Over Speed:** If AI can't cite a source, don't show it
2. **Professional Over Flashy:** Calm, confident, intelligent—not consumer-grade UX
3. **Composable Over Monolithic:** API-first, integrates with existing stacks
4. **Agentic Over Assistive:** AI executes workflows, not just suggests
5. **Security Over Features:** SOC2, GDPR, no training on user data

## Current Phase

**Phase 1 (MVP - 6 months):**
- Modules 1, 3, 4 (Command Center, Deals, Diligence)
- 7-Layer Architecture foundation
- Citation-first principle implemented
- SOC2 Type II compliance

## Key Terminology

- **TIC:** Trato Intelligence Core (our reasoning engine)
- **Verifiable Fact Layer:** Database of extracted facts with source citations
- **Citation-First:** Design principle where all AI outputs link to sources
- **Deal 360°:** Comprehensive single-deal view with tabs (Overview, Diligence, Docs, Activity)
- **Golden Citation:** Every number in generated IC decks hyperlinked to source
- **The Intelligent Hive:** Our design system (warm, connected, professional)
