# PRD: Discovery Module

**Status:** Draft
**Last Updated:** 2025-11-12
**Owner:** Product Management – Trato Hive
**Priority:** Low

---

## 1. Problem Statement

Trato Hive’s clients struggle to find and evaluate potential acquisition targets. Existing M&A CRM tools often bolt a generic search interface on top of a static database, forcing investment teams to rely on expensive third‑party data providers or manual research across disparate sources. These systems lack the ability to understand complex investment theses phrased in natural language, surface lookalike companies based on nuanced attributes, or visualise markets in an intuitive way. As a result, sourcing teams waste hours stitching together lists, and opportunities slip through the cracks because there is no single, intelligent sourcing workflow【477696921253264†L174-L205】.

**Current State:**
- Sourcing is primarily manual: associates compile lists using external data platforms and spreadsheets. There is no unified pipeline to manage targets.
- Generic CRMs do not understand PE/VC investment theses; they require users to translate nuanced criteria into rigid filters. There is no natural language interface for formulating queries.
- There is no relationship intelligence – emails and meetings are not automatically captured, and the system cannot identify warm introductions or overlapping networks【901997652264231†L82-L87】.
- Lookalike discovery is limited: users must manually browse comparables or rely on expensive platforms like PitchBook/CapIQ. There is no AI matching engine for finding similar companies based on industry, size, growth metrics, or strategic fit.
- Market mapping is a static output built manually in PowerPoint. There is no dynamic, interactive visualisation to explore segments or sub‑categories.

**Desired State:**
- Provide an AI‑native sourcing workspace where users can express investment theses in natural language (e.g., “UK SaaS companies with 20–100 employees and >30 % YoY revenue growth in insurance vertical”) and receive structured lists of potential targets. The system should parse complex queries, identify relevant attributes (industry, geography, size, growth) and return companies from our internal knowledge graph or freely available datasets.
- Surface lookalike companies using a deep attribute matching algorithm that considers financial metrics, product traits, technology stack and ownership structure. Results should display similarity scores and explanations.
- Generate auto‑built market maps that visualise sectors, sub‑sectors and company clusters using a hexagonal layout inspired by the Intelligent Hive design system. Users can zoom, filter and download maps.
- Maintain a first‑party target list entity so that discovered companies flow directly into the Deals module. Avoid reliance on costly external connectors; leverage our internal knowledge graph, publicly available company registries and open data sets.

---

## 2. Goals & Non‑Goals

### Goals (What we **WILL** do)
1. **Natural Language Sourcing:** Build an interface where users type investment criteria in plain language. The system parses the intent and returns a ranked list of companies along with key attributes and links to additional details.
2. **Lookalike Discovery:** Provide a tool that, given an existing deal or a sample company, finds similar companies based on multi‑dimensional similarity, displays similarity scores and allows users to add them to their pipeline.
3. **Market Maps:** Automatically generate interactive market maps in a honeycomb pattern showing sectors, sub‑sectors and companies. Users can drill down, filter and export the map as an image or embed it in presentations.
4. **Target List Management:** Create and persist search results as target lists, with metadata such as query terms, creation date and relevance scores. Target lists integrate with the Deals module for triage and pipeline management.
5. **Internal and Open Data:** Leverage our internal data (firm’s knowledge graph, existing deals, verifiable fact layer) and open‑source datasets (e.g., national company registries, open financial filings) to populate search results. Avoid expensive third‑party API integrations for the MVP; provide pluggable architecture for optional connectors in the future.

### Non‑Goals (What we **WILL NOT** do in this version)
1. Build custom data ingestion pipelines for proprietary paid databases (e.g., PitchBook, Capital IQ). These may be considered in future versions but are out of scope for this initial implementation.
2. Provide real‑time valuations or financial projections. The focus is on discovery, not full financial analysis.
3. Implement a full CRM lead nurturing workflow (email campaigns, lead scoring). That functionality belongs to external marketing CRMs.
4. Create bespoke deal recommendation models. We will return structured lists and similarity scores but not rank potential deals by IRR or risk.

---

## 3. User Stories

### Primary User Personas
- **PE/M&A Associate:** Responsible for sourcing and screening potential acquisition targets. Needs a fast, comprehensive way to find companies matching complex criteria without sifting through multiple platforms.
- **Analyst/Researcher:** Supports associates by conducting deeper analysis. Needs tools to discover lookalike companies, enrich company profiles and map market landscapes.

### User Stories (Format: As a [user], I want to [action], so that [benefit])

**Epic 1: Natural Language Sourcing**
- As a **PE associate**, I want to type a thesis like “mid‑market renewable energy companies in Europe with EBITDA between £5 m and £20 m” so that I quickly get a list of relevant targets.
- As an **analyst**, I want the system to highlight why each company is included (e.g., location, revenue range, industry tag) so that I can verify the match criteria.
- As a **PE associate**, I want to save my search as a “target list” so that I can revisit it and track changes over time.

**Epic 2: Lookalike Discovery**
- As a **PE associate**, I want to pick an existing deal in my pipeline and ask for similar companies so that I can expand my sourcing funnel with lookalike targets.
- As an **analyst**, I want to adjust similarity criteria (e.g., financial metrics vs. technology stack) so that I can tailor results to our investment thesis.

**Epic 3: Market Map Generation**
- As an **analyst**, I want to generate a market map for “health‑tech startups in the GCC” so that I can visualise the competitive landscape and identify under‑served niches.
- As a **PE associate**, I want to click on a hexagon in the market map and see the companies within that segment so that I can navigate from macro view to detailed lists.

**Epic 4: Target List Management**
- As a **PE associate**, I want to add selected companies from a search result into my pipeline with one click so that they appear in the Deals module for screening.
- As a **researcher**, I want to annotate target lists with notes (e.g., data source, reliability) so that team members understand the context when reviewing deals.

---

## 4. User Experience (UX Flow)

### Entry Point
Users access the Discovery module from the Command Center via the left navigation or by clicking “Discovery” in the navigation bar. The module loads with a clean search bar and access to saved target lists.

### Main User Flow (Step‑by‑Step)
1. **User Action:** The user types a natural language query in the search bar (e.g., “Australian fintech startups with revenue >$10 m”).
   - **System Response:** The system sends the query to the Sourcing Agent, which uses the Semantic Layer to extract entities and intents, then queries the internal knowledge graph and open datasets via our data plane.
   - **UI State:** Loading indicator shows progress. The results area remains blank with a skeleton loader.

2. **User Action:** The system returns a list of companies ranked by relevance. The user reviews the list.
   - **System Response:** Each company card displays name, location, size, industry, revenue range, key tags and a “similarity score” where applicable. Cards include a “+ Add to Pipeline” button.
   - **UI State:** Cards are arranged in a responsive grid. A panel shows the parsed query (e.g., filters extracted) with an option to refine criteria.

3. **User Action:** The user selects a company and clicks “Find lookalikes”.
   - **System Response:** The Lookalike Service computes similarity based on multiple dimensions and returns a list of similar companies with explanation chips (e.g., “same industry”, “similar revenue”).
   - **UI State:** A side panel opens with lookalike results. The user can adjust similarity weightings via sliders.

4. **User Action:** The user clicks “Generate Market Map” for a segment.
   - **System Response:** The system clusters companies by sub‑sector and draws a hexagonal map. Each hexagon shows the count of companies in that cluster.
   - **UI State:** A honeycomb chart appears with interactive tooltips. Clicking a hexagon expands the list of companies in that cluster.

5. **User Action:** The user saves the search as a target list and adds selected companies to the pipeline.
   - **System Response:** The system creates a TargetList record, associates selected companies and writes them to the Deals module. The list appears under “My Target Lists”.
   - **UI State:** Confirmation toast appears. The navigation shows the new target list.

### Exit Points
- **Primary:** User navigates back to Command Center or Deals module after adding companies.
- **Alternate:** User exports a market map as PNG/PPT for inclusion in presentations.

### Edge Cases
- **Ambiguous Queries:** If the query cannot be parsed (e.g., incomplete criteria), the system prompts the user to clarify or suggests alternative phrasing.
- **No Results:** If no companies match, the system suggests broadening the search or switching to similar industries/geographies.
- **Rate Limiting:** To prevent abuse, limit queries per minute and display a friendly error message if exceeded.

---

## 5. Features & Requirements

### Feature 1: Natural Language Sourcing

**Description:** Allow users to input free‑form investment theses and return a list of companies that match the criteria. The feature extracts entities and intents from the query, performs fuzzy matching and ranking across internal and public datasets, and displays results with key attributes and relevance scores.

**Functional Requirements:**
1. Accept queries up to 256 characters containing descriptive investment criteria (industry, geography, size, growth, profitability, business model, ownership).
2. Parse queries using the TIC Core (Layer 3) to identify entities and numeric ranges; fallback to pattern matching if the AI fails.
3. Query the Semantic Layer (Layer 2) and Data Plane (Layer 1) for companies matching the criteria. Use internal knowledge graph and open data sources; avoid external paid APIs.
4. Rank results based on match strength, recentness of data and company activity. Show ranking rationale (e.g., highlight which criteria matched) to support transparency.
5. Provide filters and sorting (e.g., by revenue, headcount, location) in the results UI.

**Non‑Functional Requirements:**
- **Performance:** Results should return within 2 seconds for typical queries; p95 <5 seconds for complex queries.
- **Scalability:** Support up to 100 concurrent users and 10,000 records per query without degradation.
- **Security:** Only authenticated users can run searches; implement rate limiting; no sensitive personal data is returned.
- **Accessibility:** Comply with WCAG 2.1 AA standards for forms, lists and charts.

**UI/UX Requirements:**
- **Design System:** Use Soft Sand background with Gold accents for search bar; results cards on Charcoal Black with Teal Blue highlights for match criteria.
- **Typography:** Headings in Lora; body text in Inter.
- **Components:** Use `packages/ui/Input` for the search bar, `packages/ui/Card` for company cards, `packages/ui/Button` for actions.
- **Citation‑First Principle:** When showing aggregated metrics (e.g., revenue), highlight the number in Teal Blue and provide a [cite] button that opens the citation modal showing the data source (e.g., registry filing) with excerpt.

**Dependencies:**
- Packages: `packages/tic-core` for query parsing; `packages/data` for internal data access; `packages/ui` for components.
- Other Features: Deals module to add companies into the pipeline.
- External Services: None for MVP; optional connectors flagged for future versions.

### Feature 2: Lookalike Discovery

**Description:** Given a selected company, compute and display a set of similar companies based on multi‑dimensional criteria such as industry, size, growth, technology and ownership. Provide similarity scores and explanation chips.

**Functional Requirements:**
1. Triggered either from a company card or from within a deal.
2. Use a vector‑based similarity model in the Semantic Layer that ingests company attributes and computes similarity scores across our knowledge graph.
3. Allow users to adjust weightings (e.g., emphasise financial metrics vs. product type) before running the similarity search.
4. Return up to 20 similar companies with explanation chips (e.g., “similar revenue”, “same customer segment”).
5. Provide an option to bulk add lookalikes to a target list or the pipeline.

**Non‑Functional Requirements:**
- **Performance:** Generate lookalike results within 3 seconds (p95 <6 seconds).
- **Scalability:** Support 5 concurrent lookalike queries per user without degraded performance.
- **Security:** Restrict lookalike search to authenticated users; no PII leakage.
- **Accessibility:** Explanation chips must be keyboard navigable and screen reader friendly.

**UI/UX Requirements:**
- Use a slide‑out panel on the right; maintain context by dimming background.
- Show similarity scores as bars with Teal Blue fill; chips with Gold outline when highlighted.
- Provide toggles or sliders to adjust weightings.

**Dependencies:**
- Packages: `packages/semantic` for similarity model; `packages/ui` for slider and chip components.
- Other Features: Natural Language Sourcing to provide initial company data.

### Feature 3: Market Maps

**Description:** Generate an interactive, hexagon‑based market map that visualises industries and sub‑industries with counts of companies. Maps are auto‑generated based on search results or custom criteria and can be exported as PNG or inserted into reports.

**Functional Requirements:**
1. Accept a set of companies (from a search result or user‑defined list) and cluster them into sectors/sub‑sectors using a hierarchical taxonomy.
2. Render a honeycomb chart where each hexagon represents a sub‑sector and displays the number of companies within it.
3. Allow users to zoom into a hexagon to see underlying companies and navigate back.
4. Provide download/export to PNG/PPT.
5. Persist maps with metadata (search criteria, timestamp) and make them available in the Target List record.

**Non‑Functional Requirements:**
- **Performance:** Generate the initial map within 4 seconds; maintain 60 fps for interactive zoom/pan.
- **Scalability:** Support up to 5 nested levels of sub‑sectors and 100 hexagons without performance degradation.
- **Security:** Maps do not contain sensitive data; user authentication required to generate and save maps.
- **Accessibility:** Tooltips and interactive elements must be accessible via keyboard and screen readers.

**UI/UX Requirements:**
- Use hexagonal layout consistent with the Intelligent Hive aesthetic. Background in Soft Sand; hexagons with Gold borders and Teal Blue fill when selected.
- Use `packages/ui/Chart` for custom honeycomb chart component.
- Provide clear legend and filter controls.

**Dependencies:**
- Packages: `packages/charts` for honeycomb rendering; `packages/data` for taxonomy; `packages/ui` for interactive components.
- Other Features: Ties into Natural Language Sourcing for initial data.

### Feature 4: Target List Management

**Description:** Allow users to save search results as named target lists, annotate them and add companies to the Deals module. Target lists serve as a bridge between discovery and pipeline.

**Functional Requirements:**
1. Provide a “Save as Target List” action from search results or lookalike panels.
2. Persist a TargetList entity containing metadata: name, description, query text, filters, creation date, userId, and list of companies.
3. Allow editing of target list name and description. Support adding/removing companies from the list.
4. Integrate with Deals module: selected companies can be bulk added as deals with default pipeline stage “sourcing”.
5. Display “My Target Lists” tab with pagination, search and sorting.

**Non‑Functional Requirements:**
- **Performance:** Saving a list should take <1 second; retrieving lists should take <500 ms.
- **Scalability:** Support up to 1,000 target lists per user.
- **Security:** Apply role‑based access control; only owner or firm admins can modify or delete lists.
- **Accessibility:** List management components must follow accessibility guidelines.

**UI/UX Requirements:**
- Use `packages/ui/Table` for listing target lists; `packages/ui/Dialog` for confirming deletion.
- Use Soft Sand background with Gold accents; highlight active list with Teal Blue border.

**Dependencies:**
- Packages: `packages/data` for persistent storage; `packages/ui` for components.
- Other Features: Deals module for pipeline integration.

---

## 6. Data Model & Architecture

### Data Entities

**Company**
```typescript
interface Company {
  id: string
  name: string
  industry: string
  subIndustry: string
  headcount: number | null
  revenueRange: string | null
  country: string
  region: string | null
  growthRate: number | null
  technologyTags: string[]
  ownership: string | null
  description: string | null
  sources: Citation[]      // array of citation objects referencing source documents
  createdAt: Date
  updatedAt: Date
}
```

**TargetList**
```typescript
interface TargetList {
  id: string
  name: string
  description: string | null
  query: string
  filters: object
  companyIds: string[]
  ownerId: string
  firmId: string
  createdAt: Date
  updatedAt: Date
}
```

**Citation**
```typescript
interface Citation {
  factId: string
  sourceId: string        // Document ID
  pageNumber: number
  excerpt: string         // Text excerpt with context
  confidence: number      // 0-1 confidence score
  timestamp: Date         // When fact was extracted
}
```

### Architecture Layers

**7‑Layer Architecture Integration:**
- **Layer 1 (Data Plane):** Ingests and stores company data from internal knowledge graph and open‑source registries. Maintains SearchQuery and TargetList tables. Provides retrieval APIs.
- **Layer 2 (Semantic Layer):** Houses the entity store and vector embeddings used for similarity search. Provides the Lookalike model and supports natural‑language query decomposition.
- **Layer 3 (TIC Core):** Performs query parsing, entity extraction and summarisation of results. Facilitates ranking and explanation generation.
- **Layer 4 (Agentic Layer):** Implements the Sourcing Agent orchestrating queries to the Data Plane and Semantic Layer. Coordinates the Lookalike Agent and Market Map Agent.
- **Layer 5 (Experience Layer):** Front‑end React components for search bar, results cards, lookalike panel and market map. Uses Tailwind CSS tokens from The Intelligent Hive design system.
- **Layer 6 (Governance Layer):** Enforces authentication, firmId‑based row‑level security, logging of search and list operations for audit purposes, and input validation using Zod schemas.
- **Layer 7 (API Layer):** Exposes endpoints such as `/api/v1/discovery/search`, `/api/v1/discovery/lookalike`, `/api/v1/discovery/market-map`, and `/api/v1/discovery/lists` secured with JWT and firm permissions.

### Data Ownership
- **Owns:** Company entity (discovered through search), TargetList, SearchQuery logs.
- **Reads:** Verifiable facts from the Semantic Layer; user and firm data from Auth module.
- **Writes:** TargetList entries and SearchQuery logs; new companies optionally inserted into knowledge graph (flagged for manual review).

---

## 7. API Specification

### Endpoint 1: `POST /api/v1/discovery/search`

```http
POST /api/v1/discovery/search
```

**Description:** Accepts a natural language query and returns a paginated list of companies matching the criteria.

**Authentication:** Required (Bearer token)

**Authorization:** Roles allowed: Admin, Manager, Analyst, Viewer

**Request:**
```typescript
// Headers
Authorization: Bearer {token}
Content-Type: application/json

// Body
{
  query: string,        // natural language criteria
  page?: number,        // optional, default 1
  limit?: number        // optional, default 20
}
```

**Response (Success):**
```typescript
// Status: 200 OK
{
  data: Company[],
  meta: {
    page: number,
    limit: number,
    total: number
  }
}
```

**Response (Error):**
```typescript
// Status: 400 | 401 | 403 | 500
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Validation:**
- `query` is required; max length 256 characters.
- `page` must be ≥1; `limit` must be between 1 and 100.

**Rate Limiting:** 10 requests per minute per user.

### Endpoint 2: `POST /api/v1/discovery/lookalike`

```http
POST /api/v1/discovery/lookalike
```

**Description:** Given a company ID and optional weightings, returns similar companies.

**Authentication:** Required

**Authorization:** Roles allowed: Admin, Manager, Analyst

**Request:**
```typescript
{
  companyId: string,
  weights?: {
    financial: number,   // 0–1 weight for financial similarity
    industry: number,    // 0–1 weight for industry similarity
    tech: number         // 0–1 weight for technology/product similarity
  }
}
```

**Response (Success):**
```typescript
{
  data: {
    company: Company,
    lookalikes: Array<{
      company: Company,
      score: number,
      explanations: string[]
    }>
  }
}
```

**Validation:**
- `companyId` required.
- `weights` values between 0 and 1; sum should be ≤1 (normalize if not provided).

**Rate Limiting:** 5 requests per minute per user.

### Endpoint 3: `POST /api/v1/discovery/market-map`

```http
POST /api/v1/discovery/market-map
```

**Description:** Generates a market map for a given set of companies or a search query.

**Authentication:** Required

**Authorization:** Roles allowed: Admin, Manager, Analyst

**Request:**
```typescript
{
  query?: string,
  companyIds?: string[]    // either query or companyIds required
}
```

**Response (Success):**
```typescript
{
  data: {
    mapId: string,
    hexagons: Array<{
      id: string,
      name: string,
      count: number,
      parentId?: string
    }>
  }
}
```

**Validation:**
- Either `query` or `companyIds` must be provided; not both.

**Rate Limiting:** 3 requests per minute per user.

### Endpoint 4: `POST /api/v1/discovery/lists`

```http
POST /api/v1/discovery/lists
```

**Description:** Creates a new target list with selected companies.

**Authentication:** Required

**Authorization:** Roles allowed: Admin, Manager, Analyst

**Request:**
```typescript
{
  name: string,
  description?: string,
  query: string,
  filters: object,
  companyIds: string[]
}
```

**Response (Success):**
```typescript
{
  data: TargetList
}
```

**Validation:**
- `name` required; length 1–128.
- `companyIds` must contain at least one company ID.

**Rate Limiting:** 5 requests per minute per user.

### Endpoint 5: `GET /api/v1/discovery/lists`

```http
GET /api/v1/discovery/lists
```

**Description:** Returns a paginated list of the user’s target lists.

**Authentication:** Required

**Authorization:** Roles allowed: Admin, Manager, Analyst, Viewer

**Request Query Params:** `page`, `limit`, `sort` (e.g., createdAt desc)

**Response (Success):**
```typescript
{
  data: TargetList[],
  meta: {
    page: number,
    limit: number,
    total: number
  }
}
```

**Rate Limiting:** 10 requests per minute per user.

---

## 8. Testing & Acceptance Criteria

### Unit Testing Requirements
- [ ] Query parsing functions achieve >80 % coverage, including edge cases such as incomplete criteria and numeric ranges.
- [ ] Lookalike algorithm unit tests cover weighting logic and similarity scoring.
- [ ] Market map clustering functions are tested for correct grouping and hexagon positioning.
- [ ] Target list CRUD operations tested for correct persistence and security checks.

### Integration Testing Requirements
- [ ] End‑to‑end testing for the natural language search flow: query → results → target list creation.
- [ ] Integration tests for lookalike service connecting the API to the Semantic Layer and verifying explanation chips.
- [ ] Market map generation tested with various sizes of company sets.
- [ ] Access control tests to ensure only authorized roles can create or modify target lists.

### E2E Testing Requirements (User Flows)
- [ ] User enters a query, receives results, saves as target list and adds companies to pipeline.
- [ ] User selects a company, generates lookalikes, adjusts weighting sliders and adds some results to a target list.
- [ ] User generates a market map from search results, drills down into a sub‑sector and exports the map as PNG.
- [ ] Accessibility: all forms, cards and charts navigable via keyboard; screen reader compatibility verified.

### Acceptance Criteria (Checklist)

**Functional:**
- [ ] Natural language sourcing returns relevant results and displays match rationale.
- [ ] Lookalike discovery returns similar companies with explanation chips and allows weighting adjustments.
- [ ] Market maps cluster companies correctly and are interactive and exportable.
- [ ] Target lists can be created, edited, searched and integrated into Deals.
- [ ] All API endpoints function according to specification.

**Non‑Functional:**
- [ ] Response times meet performance targets.
- [ ] Role‑based access control enforced; row‑level security implemented (firmId check).
- [ ] Unit test coverage >80 % across services; integration tests pass.
- [ ] WCAG 2.1 AA compliance achieved.

**Design:**
- [ ] Colors, typography and components align with The Intelligent Hive design system (Soft Sand, Gold, Charcoal Black, Teal Blue; Lora/Inter fonts; 8 px border radius).
- [ ] Citation‑first principle implemented for displayed metrics with citation modal accessible from numbers.
- [ ] Honeycomb charts follow hexagonal style consistent with design system.
- [ ] All interactive elements show focus states and accessible labels.

**Documentation:**
- [ ] API documentation complete with examples.
- [ ] Developer guides for customizing similarity weights and adding new sectors.
- [ ] README updated with new endpoints and data model definitions.

---

## 9. Design Specifications

### The Intelligent Hive Integration

**Color Usage:**
- **Soft Sand (#F5EFE7):** Backgrounds of search pages and cards.
- **Gold/Honey (#E2A74A):** Accents on buttons, active chips and hexagon borders in market maps.
- **Charcoal Black (#1A1A1A):** Text and card borders for contrast.
- **Teal Blue (#2F7E8A):** Highlighted numbers (e.g., revenues), match criteria and similarity bars; clickable citations.

**Typography:**
- **Headings:** Lora, weight 600, sizes varying from `text-2xl` to `text-base`.
- **Body/UI:** Inter, weight 400, sizes from `text-sm` to `text-md`.

**Components:**
- Search bar using `packages/ui/Input` with placeholder text in muted Charcoal.
- Company cards using `packages/ui/Card` with metrics and action buttons.
- Lookalike panel using `packages/ui/Panel` with slider controls (`packages/ui/Slider`).
- Honeycomb chart built with custom `packages/charts/HoneycombChart` component.
- Target list table using `packages/ui/Table` and `packages/ui/Button`.

**Citation‑First Principle:**
- All numbers derived from data (e.g., revenue ranges, growth rates) are displayed in Teal Blue with a small superscript [cite] button. Clicking opens a modal (max‑width 600 px, border‑radius 12 px, white background) showing the source document’s name, page number, highlighted excerpt and link to view the document【407830420033055†L168-L176】.
- The modal loads asynchronously (<200 ms) and includes controls for closing via Escape or clicking outside. Focus is trapped inside the modal for accessibility.

### Wireframes / Mockups
Key screens include the discovery home page (search bar and target list list), search results page (cards with filters), lookalike side panel, market map viewer and target list management. Figma files can be referenced via `docs/design/wireframes/discovery.fig`. All components adhere to 8 px grid and spacing guidelines.

---

## 10. Security & Compliance

### Authentication & Authorization
- **Authentication Required:** Yes. All endpoints require a valid JWT issued by our Auth service.
- **Roles Allowed:** Admin, Manager, Analyst, Viewer (viewers can search and view lists but not create/edit target lists).
- **Row‑Level Security:** All queries and lists are scoped by `firmId`. Users cannot see or save data for other firms.

### Data Privacy
- **PII Handling:** The module should not expose personal identifiable information. Only business information (company names, industry, revenue ranges) is returned.
- **GDPR Compliance:** Users may request deletion of their queries and target lists. Provide endpoints to delete saved searches and lists.
- **Encryption:** Data at rest encrypted using AES‑256; data in transit via TLS 1.3.

### Audit Logging
**Events to Log:**
- Search submissions (userId, query, timestamp, firmId).
- Lookalike queries (userId, companyId, weights).
- Target list creation, update and deletion (userId, targetListId, action).

**Log Format:**
```typescript
{
  timestamp: ISO8601,
  userId: string,
  action: string,
  resourceId: string,
  firmId: string,
  metadata: object
}
```

### Security Considerations
- Input validation with Zod to prevent injection attacks.
- XSS prevention by sanitising user input and escaping HTML in results.
- SQL injection protection via parameterised queries in the data layer.
- Rate limiting to deter scraping and abuse.

---

## 11. Performance Requirements

### Response Times
- **Search:** ≤2 s (p95 ≤5 s) for natural language queries.
- **Lookalike:** ≤3 s (p95 ≤6 s) to compute similarity.
- **Market Map:** ≤4 s initial generation; interactive updates at 60 fps.

### Scalability
- Support 100 concurrent users performing searches and lookalike queries.
- Handle 10,000 companies per search result; ability to scale horizontally as dataset grows.
- Maintain low latency using caching and pre‑computed embeddings.

### Optimization Strategies
- Cache frequent queries and results in Redis or similar; invalidate cache on data updates.
- Use vector indices for similarity search (e.g., HNSW) to ensure sub‑second retrieval.
- Paginate results and lazy load cards to improve initial page render.

---

## 12. Risks & Mitigations

### Technical Risks

**Risk 1: Inaccurate Query Parsing**
- **Impact:** Medium – poor parsing leads to irrelevant results.
- **Likelihood:** Medium.
- **Mitigation:** Implement fallback pattern matching and allow manual filter adjustment; iterate on model fine‑tuning using user feedback.

**Risk 2: Limited Data Coverage**
- **Impact:** Medium – open data may not cover all private companies.
- **Likelihood:** High initially.
- **Mitigation:** Combine multiple open datasets; allow manual company creation; plan integration with additional data providers in future.

**Risk 3: Performance Bottlenecks in Similarity Search**
- **Impact:** High – slow responses reduce user satisfaction.
- **Likelihood:** Medium.
- **Mitigation:** Use approximate nearest neighbour algorithms; precompute embeddings; scale vector index horizontally.

### Business Risks

**Risk 1: Insufficient Market Adoption**
- **Impact:** Medium – if external data integrations are required by customers, our limited dataset may reduce adoption.
- **Mitigation:** Position as an extensible platform; highlight benefits of unified workflow and cost savings; gather user feedback for future enhancements.

### Open Questions
- [ ] **Question 1:** Which open data sources (government registries, open financial filings) offer the best coverage for our target market? 
  - **Status:** Open.
  - **Decision:** TBD after evaluating data quality.
- [ ] **Question 2:** How should we prioritise optional integration with paid data providers without undermining cost advantages?
  - **Status:** Open.
  - **Decision:** To be revisited after MVP feedback.

---

## 13. Dependencies & Integrations

### Internal Dependencies
- **Packages:**
  - `packages/data`: Data retrieval and storage for Company and TargetList entities.
  - `packages/semantic`: Vector embeddings, similarity search and taxonomy classification.
  - `packages/tic-core`: Query parsing and ranking functions.
  - `packages/ui`: UI components (Input, Card, Table, Slider, Chart, Dialog).
  - `packages/charts`: Honeycomb chart component for market maps.
- **Other Features:** Deals module (integration for adding companies); Command Center (entry point and analytics); Diligence (citation linking from discovery facts when used in deal docs).

### External Dependencies
- None for MVP. Optional connectors (e.g., Crunchbase, OpenCorporates, ORBIS) may be added later but are intentionally excluded to minimise cost. Data ingestion pipelines for open registries (e.g., UK Companies House API) may be built internally.

---

## 14. Rollout Plan

### Phase 1: Alpha (Internal Testing)
- **Timeline:** 4 weeks
- **Scope:** Natural language search, basic lookalike discovery, target list creation and pipeline integration.
- **Users:** Internal Trato Hive team (product, engineering, selected analysts).
- **Success Criteria:** Search results accuracy rated ≥70 % by internal testers; no critical bugs; p95 response times met.

### Phase 2: Beta (Limited Users)
- **Timeline:** 8 weeks
- **Scope:** Full lookalike functionality, interactive market maps, citation modal integration.
- **Users:** Selected pilot firms (e.g., Ardonagh M&A team, early adopters).
- **Success Criteria:** User satisfaction ≥80 % for search relevance and visualisation; target list adoption in ≥50 % of deals; bug rate <5 % of sessions.

### Phase 3: General Availability
- **Timeline:** 12 weeks after Beta
- **Scope:** Public release with scalability optimisations, optional connectors (if approved), documentation and training materials.
- **Users:** All Trato Hive customers.
- **Success Criteria:** 90 % of sourcing is done through Discovery module; mean time to create a target list <5 minutes; positive feedback in user surveys.

### Rollback Plan
- If critical issues arise during Beta, disable new features and revert to Alpha features using feature flags. Maintain ability to export user data for external usage.

---

## 15. Success Metrics & KPIs

### User Adoption Metrics
- **Discovery Usage Rate:** Percentage of active users performing at least one search per week – target: ≥60 %.
- **Target List Creation Rate:** Number of target lists created per firm per month – target: ≥3.

### Performance Metrics
- **Search Response Time (p95):** <5 s.
- **Lookalike Response Time (p95):** <6 s.
- **Market Map Generation Time:** <4 s (initial).

### Quality Metrics
- **Search Relevance Score:** Average user‑rated relevance of returned companies – target: ≥75 % (post‑Beta survey).
- **System Uptime:** ≥99.5 % during GA.
- **Bug Rate:** <2 % of sessions reporting errors.

### Business Metrics
- **Pipeline Growth:** Increase in number of deals added to pipeline from Discovery module – target: 30 % increase over baseline.
- **Conversion Rate:** Percentage of companies sourced via Discovery that proceed to LOI stage – target: 10 %.

---

## 16. Appendix

### Glossary
- **Natural Language Sourcing:** Using plain language queries to search for companies based on multiple attributes.
- **Lookalike Discovery:** Identifying companies similar to a reference company across various dimensions (financials, industry, technology).
- **Market Map:** Visual representation of companies within a market organised by sector and sub‑sector using hexagons.
- **Target List:** A saved set of potential acquisition targets derived from a search.
- **Sourcing Agent:** An AI agent orchestrating query parsing, data retrieval and ranking across the system.

### References
- GrowthFactor on M&A CRMs: emphasises integration of pipeline management, relationship intelligence and automation【477696921253264†L174-L205】.
- 4Degrees on relationship intelligence: stresses automatic logging of emails and meetings, and scoring relationship strength【901997652264231†L82-L87】.
- Hebbia’s Matrix platform: highlights AI‑generated CIMs, pitch decks and buyer profiles with citations【32184628154010†L160-L190】.
- Imprima AI Due Diligence: describes Smart Q&A, Smart Summaries and AI‑powered contract review【407830420033055†L117-L190】.
- V7 Labs on AI data rooms: discusses AI‑powered document analysis, risk flagging and retrieval‑augmented Q&A【156822256992488†L161-L193】.

### Revision History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-12 | 0.1 | Product Mgmt | Initial draft of Discovery PRD integrating internal spec and external research |

---

**End of PRD**