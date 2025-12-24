# 7‑Layer Architecture Overview

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Architecture Team
**Priority:** Critical

The Trato Hive platform is built on a modular **7‑Layer Architecture** that separates concerns, enforces service boundaries and enables scalable, cost‑efficient development. This document provides a high‑level overview of each layer, explains how data flows between them, maps packages to layers, and outlines design rationale and anti‑patterns to avoid.

## 1. Introduction

Traditional M&A platforms often collapse data storage, AI logic and user interface into a single monolith. This leads to tight coupling, hard‑to‑maintain codebases and security vulnerabilities. The 7‑Layer Architecture divides the system into distinct layers, each responsible for a specific set of concerns:

1. **Data Plane** – Ingests and stores raw documents (e.g., PDFs, spreadsheets) and provides access via storage APIs.
2. **Semantic Layer** – Extracts verifiable facts and builds the knowledge graph; supports vector search and citation linking.
3. **TIC Core** – The intelligence engine orchestrating LLMs and embeddings; turns queries into answers with citations.
4. **Agentic Layer** – Composes multi‑step AI workflows (agents) that orchestrate tasks across layers, such as sourcing, diligence and document generation.
5. **Experience Layer** – Presents user interfaces and APIs; handles user interactions and routes requests to backend services.
6. **Governance Layer** – Provides security, authentication, authorization, audit logging and compliance controls.
7. **API Layer** – Exposes RESTful endpoints externally and mediates communications between the Experience layer and internal services.

This layered design promotes **verifiability**, **unified workflows** and **agentic orchestration**, core principles defined in the product specification【516335038796236†L90-L99】.

## 2. High‑Level Diagrams

### 2.1 7‑Layer Stack

Below is a conceptual representation of the stack (from bottom to top):

```
┌─────────────────────────────────────────────────────────────┐
| Layer 7 – API Layer (REST)                                 |
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
| Layer 6 – Governance (Auth, RBAC, Audit, Compliance)        |
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
| Layer 5 – Experience (Web App, API Routes)                 |
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
| Layer 4 – Agentic Layer (AI Workflows)                     |
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
| Layer 3 – TIC Core (LLM Orchestration & Reasoning)         |
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
| Layer 2 – Semantic Layer (Knowledge Graph & Facts)         |
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
| Layer 1 – Data Plane (Ingestion & Storage)                 |
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Overview

At a high level, data flows from the bottom up: documents are ingested via the **Data Plane**, facts are extracted into the **Semantic Layer**, the **TIC Core** uses those facts and LLMs to produce answers, the **Agentic Layer** orchestrates multi‑step tasks, the **Experience Layer** displays results to users, and the **API Layer** exposes endpoints externally. The **Governance Layer** wraps all layers, ensuring secure access and compliance.

## 3. Package‑to‑Layer Mapping

| Layer | Responsibilities | Packages/Apps |
|------|------------------|--------------|
| **1. Data Plane** | Document ingestion, OCR, storage in S3 or similar; error handling and retries. | `packages/data-plane/` (includes `ingestion/`, `parsers/`, `storage/`, `ocr/`) |
| **2. Semantic Layer** | Fact extraction, knowledge graph management, vector indexing, citation linking. | `packages/semantic-layer/` |
| **3. TIC Core** | LLM orchestration, embedding generation, reasoning and citation extraction. | `packages/ai-core/` (also referred to as `packages/tic-core/`) |
| **4. Agentic Layer** | AI workflow agents for sourcing, deals, diligence, generator; orchestrates calls across layers. | `packages/agents/` |
| **5. Experience Layer** | User interfaces and API routes; Next.js frontend and Express backend. | `apps/web/`, `apps/api/` |
| **6. Governance Layer** | Authentication (JWT/OAuth), authorization (RBAC), audit logging, encryption, compliance. | `packages/auth/`, `packages/db/`, cross‑cutting concerns |
| **7. API Layer** | RESTful endpoints, request validation, pagination, filtering, sorting, rate limiting. | `apps/api/routes/` |

## 4. Layer Responsibilities

### 4.1 Layer 1: Data Plane

Responsible for ingesting unstructured documents (PDFs, spreadsheets, emails) into the system. It performs OCR, parsing and storage. Documents are stored in a durable object store (e.g., S3), and metadata is recorded in the database. The Data Plane exposes functions like `ingestDocument()`, `parseDocument()` and `getDocument()` for other layers to use. It must handle various file formats (PDF, XLSX, email EML) and implement retry logic for network failures. Cost efficiency is achieved by using open‑source OCR (e.g., Tesseract.js) and serverless storage rather than proprietary document processing services.

### 4.2 Layer 2: Semantic Layer

Extracts structured facts from ingested documents using NLP and stores them in a knowledge graph. Facts are modelled as `{ factId, sourceId, pageNumber, excerpt, confidence, citationLink }`. Relationships link Deals → Companies → Documents → Facts, enabling lineage tracing. A vector index (e.g., Weaviate or Pinecone) facilitates semantic search and similarity queries. Citation linking ensures each fact is verifiable, fulfilling the citation‑first principle【516335038796236†L90-L99】. Interfaces include `createFact()`, `queryFacts()`, `linkCitation()` and `getKnowledgeGraph()`.

### 4.3 Layer 3: TIC Core

The Trato Intelligence Core orchestrates generative AI. It receives natural language queries, retrieves relevant facts from the Semantic Layer, constructs prompts and invokes LLMs (OpenAI GPT‑4, Anthropic Claude) to generate responses with citations. It also generates embeddings for documents and queries (using `generateEmbedding()`) and extracts citations from LLM outputs via post‑processing. The TIC Core implements prompt engineering patterns and fallback strategies to ensure deterministic behaviour and to manage token and cost budgets. Open‑source or commodity LLMs are preferred over expensive, proprietary AI tools when feasible.

### 4.4 Layer 4: Agentic Layer

This layer defines **agents** – orchestrated workflows that accomplish complex tasks such as sourcing companies, running diligence Q&A, generating IC decks or updating pipelines. Each agent follows a lifecycle: **init → plan → execute → verify → report**. Agents use YAML/JSON definitions to specify steps, conditional logic and parallelism. They call the TIC Core for reasoning, the Semantic Layer for fact retrieval and the Data Plane for document access. Examples include:
- **Sourcing Agent** (Module 2): Parses user queries, calls the Semantic Layer for candidate companies, ranks them and creates target lists.
- **Pipeline OS Agent** (Module 3): Suggests next steps for deals and logs pipeline activities.
- **Diligence Agent** (Module 4): Answers diligence questions by searching VDR documents, summarising findings and highlighting risks.
- **Generator Agent** (Module 5): Creates IC decks and LOIs with golden citations.

### 4.5 Layer 5: Experience Layer

The Experience Layer comprises the user interface (React/Next.js) and backend API routes. The frontend is built on a **Block Protocol**, allowing for dynamic, Notion-like pages (e.g., Deal 360 views) rather than static templates. It uses a **Block Editor** (based on Tiptap/ProseMirror) for content creation and a **Block Renderer** for displaying hierarchical data. The design system, **Intelligent Hive**, provides the visual components (Soft Sand backgrounds, Gold accents). The backend (Express) defines controllers that fetch "Page Trees" (nested blocks) efficiently. This layer must implement state management, input validation with Zod and error handling.

### 4.6 Layer 6: Governance Layer

Provides cross-cutting concerns for security and compliance. It maintains the core data schema, including the recursive **Block** and **Page** models that power the experience layer. It implements authentication (JWT/OAuth), authorization (role-based and row-level), audit logging (immutable logs), encryption (AES-256), and SOC2/GDPR compliance checks. It ensures multi-tenant isolation and prevents data leakage across firms. Security scanning and secret management (e.g., using Vault) also reside here.

### 4.7 Layer 7: API Layer

Defines the external contract for clients. It exposes RESTful endpoints under `/api/v1/` that forward requests to controllers in the Experience Layer. Responsibilities include request validation, parameter parsing (pagination, filtering), authentication/authorization middleware, rate limiting and uniform response formatting (e.g., `{ success: true, data, meta }`). The API Layer should not contain business logic.

## 5. Design Rationale

The 7‑Layer Architecture promotes **composability** and **independence**. By decoupling data ingestion, semantic reasoning, AI orchestration, agentic workflows, presentation, governance and external API access, each layer can evolve independently, be replaced or scaled without impacting the others. For example, we can swap Weaviate for another vector store in the Semantic Layer without modifying the TIC Core or Experience Layer. The separation also supports cost optimisation: the Data Plane uses open‑source OCR instead of proprietary OCR services; the TIC Core can orchestrate different LLM providers based on cost and performance.

## 6. Cross‑Layer Communication Patterns

- **Service Interfaces:** Each layer exposes a clear API (function calls or REST) for adjacent layers. Direct communication between non‑adjacent layers is discouraged. For example, the Experience Layer calls the Agentic Layer or TIC Core via services, not by directly accessing the Semantic Layer.
- **Asynchronous Messaging:** Long‑running tasks (e.g., document ingestion, deck generation) are triggered via message queues or task schedulers. Agents subscribe to events and update state when tasks complete.
- **Context Passing:** The TIC Core returns structured responses with citations that flow through agents to the Experience Layer. Agents must preserve citation metadata and pass it to the UI for rendering.

## 7. Integration Points

Integration happens primarily at layer boundaries:
- **Data Plane → Semantic Layer:** Document ingestion triggers fact extraction pipelines.
- **Semantic Layer → TIC Core:** Fact queries supply context for LLM prompts.
- **TIC Core → Agentic Layer:** Agents call `queryTIC()` to perform reasoning and summarisation.
- **Agentic Layer → Experience Layer:** Agent results are formatted and returned to the UI via controllers.
- **Experience → API Layer:** Controllers expose endpoints for frontend clients and external integrations.
- **Governance → All Layers:** Authentication, authorization and logging are enforced for every call.

## 8. Anti‑Patterns

To preserve the integrity of the architecture, avoid the following:
- **Skipping Layers:** Do not let the UI call the Semantic Layer directly; always go through the Experience or Agentic Layers to preserve security and auditing.
- **Cross‑Layer Coupling:** Avoid sharing database models across layers. Each layer should expose only necessary data via interfaces.
- **Embedding Business Logic in the UI:** Business rules belong in the TIC Core or Agentic Layer, not in React components.
- **Coupling to Proprietary Services:** Resist the temptation to integrate expensive third‑party data providers or AI APIs directly into the core. Use open‑source or cost‑efficient alternatives and design connectors as optional add‑ons.

## 9. Conclusion

The 7‑Layer Architecture provides a robust foundation for building an AI‑native M&A CRM. It supports verifiability, composability and security while avoiding costly external dependencies. Adhering to the layer boundaries and communication patterns described here will ensure the system remains maintainable, extensible and compliant.
