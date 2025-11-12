# Trato Hive - Complete Project Structure

**Generated:** 2025-11-11
**Last Updated:** 2025-11-12
**Status:** Foundation Complete + PRDs Finalized - Ready for Architecture Documentation

---

## 📁 Full Directory Tree

```
trato-hive/
│
├── .claude/                                      # Claude Code Workspace
│   ├── context.md                                # ✅ One-screen mission statement
│   ├── rules.md                                  # ✅ Hard guardrails (security, code quality)
│   ├── prompts.md                                # ✅ Slash commands library
│   ├── settings.local.json                       # Claude CLI settings (auto-generated)
│   └── agents/                                   # Specialist agents
│       ├── architecture-review.md                # ✅ 7-Layer Architecture validator
│       ├── design-review.md                      # ✅ UI/UX compliance reviewer
│       ├── git-manager.md                        # ✅ Git workflow automation
│       └── security-reviewer.md                  # ✅ Security & compliance reviewer
│
├── .github/                                      # GitHub Actions & workflows
│   └── workflows/                                # CI/CD pipelines
│       ├── ci.yml                                # ⬜ Main CI pipeline (to be created)
│       ├── design-review.yml                     # ⬜ Visual regression tests (to be created)
│       └── security-scan.yml                     # ⬜ Security scanning (to be created)
│
├── apps/                                         # Deployable Applications
│   │
│   ├── web/                                      # Next.js Frontend Application
│   │   ├── CLAUDE.md                             # ✅ Frontend-specific rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   ├── next.config.js                        # ⬜ To be created
│   │   ├── tailwind.config.js                    # ⬜ To be created
│   │   ├── playwright.config.ts                  # ⬜ To be created
│   │   ├── .eslintrc.js                          # ⬜ To be created
│   │   │
│   │   ├── public/                               # Static assets
│   │   │   ├── images/                           # Images
│   │   │   ├── fonts/                            # Custom fonts (Lora, Inter)
│   │   │   └── patterns/                         # Hexagonal patterns for backgrounds
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── app/                              # Next.js App Router
│   │   │   │   ├── layout.tsx                    # ⬜ Root layout
│   │   │   │   ├── page.tsx                      # ⬜ Home page (Command Center)
│   │   │   │   ├── command-center/               # Module 1 routes
│   │   │   │   ├── discovery/                    # Module 2 routes
│   │   │   │   ├── deals/                        # Module 3 routes
│   │   │   │   ├── diligence/                    # Module 4 routes
│   │   │   │   └── generator/                    # Module 5 routes
│   │   │   │
│   │   │   ├── components/                       # Shared components
│   │   │   │   ├── layouts/                      # Layout components
│   │   │   │   ├── navigation/                   # Navigation components
│   │   │   │   └── common/                       # Common UI elements
│   │   │   │
│   │   │   ├── lib/                              # Frontend utilities
│   │   │   │   ├── api-client.ts                 # ⬜ API client wrapper
│   │   │   │   ├── hooks/                        # Custom React hooks
│   │   │   │   └── utils/                        # Utility functions
│   │   │   │
│   │   │   └── styles/                           # Global styles
│   │   │       ├── globals.css                   # ⬜ Global CSS with Tailwind
│   │   │       └── design-tokens.css             # ⬜ The Intelligent Hive tokens
│   │   │
│   │   └── tests/                                # Tests
│   │       ├── unit/                             # Jest unit tests
│   │       ├── integration/                      # React Testing Library
│   │       └── e2e/                              # Playwright E2E tests
│   │
│   └── api/                                      # Express Backend Application
│       ├── CLAUDE.md                             # ✅ Backend-specific rules (template)
│       ├── package.json                          # ⬜ To be created
│       ├── tsconfig.json                         # ⬜ To be created
│       ├── Dockerfile                            # ⬜ To be created
│       ├── .eslintrc.js                          # ⬜ To be created
│       │
│       ├── src/                                  # Source code
│       │   ├── index.ts                          # ⬜ Main entry point
│       │   ├── app.ts                            # ⬜ Express app setup
│       │   │
│       │   ├── routes/                           # API routes
│       │   │   ├── index.ts                      # ⬜ Route aggregator
│       │   │   ├── auth.routes.ts                # ⬜ Authentication routes
│       │   │   ├── deals.routes.ts               # ⬜ Deals endpoints
│       │   │   ├── discovery.routes.ts           # ⬜ Discovery endpoints
│       │   │   ├── diligence.routes.ts           # ⬜ Diligence endpoints
│       │   │   ├── generator.routes.ts           # ⬜ Generator endpoints
│       │   │   └── command-center.routes.ts      # ⬜ Command Center endpoints
│       │   │
│       │   ├── controllers/                      # Request controllers
│       │   │   ├── auth.controller.ts            # ⬜ Auth controller
│       │   │   ├── deals.controller.ts           # ⬜ Deals controller
│       │   │   ├── discovery.controller.ts       # ⬜ Discovery controller
│       │   │   ├── diligence.controller.ts       # ⬜ Diligence controller
│       │   │   ├── generator.controller.ts       # ⬜ Generator controller
│       │   │   └── command-center.controller.ts  # ⬜ Command Center controller
│       │   │
│       │   ├── services/                         # Business logic
│       │   │   ├── auth.service.ts               # ⬜ Auth service
│       │   │   ├── deals.service.ts              # ⬜ Deals service
│       │   │   ├── discovery.service.ts          # ⬜ Discovery service
│       │   │   ├── diligence.service.ts          # ⬜ Diligence service
│       │   │   ├── generator.service.ts          # ⬜ Generator service
│       │   │   └── command-center.service.ts     # ⬜ Command Center service
│       │   │
│       │   ├── middleware/                       # Express middleware
│       │   │   ├── auth.middleware.ts            # ⬜ Authentication middleware
│       │   │   ├── error-handler.middleware.ts   # ⬜ Error handler
│       │   │   ├── validation.middleware.ts      # ⬜ Request validation
│       │   │   └── rate-limit.middleware.ts      # ⬜ Rate limiting
│       │   │
│       │   └── lib/                              # Backend utilities
│       │       ├── logger.ts                     # ⬜ Logging utility
│       │       ├── errors.ts                     # ⬜ Custom error classes
│       │       └── utils/                        # Utility functions
│       │
│       └── tests/                                # Tests
│           ├── unit/                             # Jest unit tests
│           ├── integration/                      # Supertest integration tests
│           └── e2e/                              # Full API flow tests
│
├── packages/                                     # Shared Libraries (8 packages)
│   │
│   ├── ui/                                       # React Component Library (Layer 5)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   ├── .storybook/                           # Storybook configuration
│   │   │   ├── main.ts                           # ⬜ To be created
│   │   │   └── preview.ts                        # ⬜ To be created
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   │
│   │   │   ├── components/                       # UI components
│   │   │   │   ├── Button/                       # Button component
│   │   │   │   │   ├── Button.tsx                # ⬜ Component
│   │   │   │   │   ├── Button.test.tsx           # ⬜ Tests
│   │   │   │   │   ├── Button.stories.tsx        # ⬜ Storybook stories
│   │   │   │   │   └── index.ts                  # Export
│   │   │   │   │
│   │   │   │   ├── Input/                        # Input component
│   │   │   │   ├── Card/                         # Card component
│   │   │   │   ├── Modal/                        # Modal component
│   │   │   │   ├── Citation/                     # ⬜ Citation component (CRITICAL)
│   │   │   │   ├── VerifiableNumber/             # ⬜ Number with citation link
│   │   │   │   ├── Navigation/                   # Navigation components
│   │   │   │   ├── Tabs/                         # Tabs component
│   │   │   │   └── HexagonPattern/               # Hexagonal background pattern
│   │   │   │
│   │   │   ├── tokens/                           # Design system tokens
│   │   │   │   ├── colors.ts                     # ⬜ The Intelligent Hive colors
│   │   │   │   ├── typography.ts                 # ⬜ Font families, sizes
│   │   │   │   ├── spacing.ts                    # ⬜ 4px base spacing scale
│   │   │   │   └── shadows.ts                    # ⬜ Shadow tokens
│   │   │   │
│   │   │   └── hooks/                            # Shared React hooks
│   │   │       ├── useCitation.ts                # ⬜ Citation modal hook
│   │   │       └── useTheme.ts                   # ⬜ Theme hook
│   │   │
│   │   └── tests/                                # Tests
│   │       └── setup.ts                          # Test setup
│   │
│   ├── db/                                       # Database Layer (Layer 6)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   │
│   │   ├── prisma/                               # Prisma configuration
│   │   │   ├── schema.prisma                     # ⬜ Database schema
│   │   │   ├── migrations/                       # Database migrations
│   │   │   └── seed.ts                           # ⬜ Seed script
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   ├── client.ts                         # ⬜ Prisma client singleton
│   │   │   │
│   │   │   ├── schema/                           # Schema definitions
│   │   │   │   ├── user.ts                       # ⬜ User model
│   │   │   │   ├── firm.ts                       # ⬜ Firm model (multi-tenancy)
│   │   │   │   ├── deal.ts                       # ⬜ Deal model
│   │   │   │   ├── company.ts                    # ⬜ Company model
│   │   │   │   ├── document.ts                   # ⬜ Document model
│   │   │   │   ├── fact.ts                       # ⬜ Fact model (with citations)
│   │   │   │   └── audit-log.ts                  # ⬜ Audit log model
│   │   │   │
│   │   │   ├── migrations/                       # Migration utilities
│   │   │   └── seed/                             # Seed data
│   │   │       ├── users.seed.ts                 # ⬜ User seed data
│   │   │       ├── firms.seed.ts                 # ⬜ Firm seed data
│   │   │       └── deals.seed.ts                 # ⬜ Deal seed data
│   │   │
│   │   └── tests/                                # Tests
│   │
│   ├── auth/                                     # Authentication & Authorization (Layer 6)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   │
│   │   │   ├── providers/                        # Auth providers
│   │   │   │   ├── jwt.provider.ts               # ⬜ JWT authentication
│   │   │   │   ├── oauth.provider.ts             # ⬜ OAuth (Google, Microsoft)
│   │   │   │   └── saml.provider.ts              # ⬜ SAML (enterprise SSO)
│   │   │   │
│   │   │   ├── middleware/                       # Auth middleware
│   │   │   │   ├── require-auth.ts               # ⬜ Authentication required
│   │   │   │   └── require-role.ts               # ⬜ RBAC authorization
│   │   │   │
│   │   │   └── utils/                            # Utilities
│   │   │       ├── jwt.ts                        # ⬜ JWT generation/verification
│   │   │       ├── hash.ts                       # ⬜ Password hashing (bcrypt)
│   │   │       └── session.ts                    # ⬜ Session management
│   │   │
│   │   └── tests/                                # Tests
│   │
│   ├── shared/                                   # Shared Types & Utilities (Cross-layer)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   │
│   │   │   ├── types/                            # TypeScript types
│   │   │   │   ├── deal.types.ts                 # ⬜ Deal types
│   │   │   │   ├── company.types.ts              # ⬜ Company types
│   │   │   │   ├── document.types.ts             # ⬜ Document types
│   │   │   │   ├── fact.types.ts                 # ⬜ Fact types
│   │   │   │   ├── user.types.ts                 # ⬜ User types
│   │   │   │   └── api.types.ts                  # ⬜ API request/response types
│   │   │   │
│   │   │   ├── constants/                        # Constants & enums
│   │   │   │   ├── pipeline-stages.ts            # ⬜ PipelineStage enum
│   │   │   │   ├── user-roles.ts                 # ⬜ UserRole enum
│   │   │   │   ├── fact-types.ts                 # ⬜ FactType enum
│   │   │   │   └── document-types.ts             # ⬜ DocumentType enum
│   │   │   │
│   │   │   ├── validators/                       # Zod validation schemas
│   │   │   │   ├── deal.schema.ts                # ⬜ Deal validation
│   │   │   │   ├── user.schema.ts                # ⬜ User validation
│   │   │   │   ├── document.schema.ts            # ⬜ Document validation
│   │   │   │   └── api.schema.ts                 # ⬜ API validation
│   │   │   │
│   │   │   └── utils/                            # Utility functions
│   │   │       ├── date.ts                       # ⬜ Date formatting
│   │   │       ├── string.ts                     # ⬜ String helpers
│   │   │       └── currency.ts                   # ⬜ Currency formatting
│   │   │
│   │   └── tests/                                # Tests
│   │
│   ├── ai-core/                                  # TIC - Trato Intelligence Core (Layer 3)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   │
│   │   │   ├── reasoning/                        # Core reasoning engine
│   │   │   │   ├── tic.ts                        # ⬜ Main TIC engine
│   │   │   │   ├── query-processor.ts            # ⬜ Natural language query processing
│   │   │   │   └── response-generator.ts         # ⬜ Response generation
│   │   │   │
│   │   │   ├── embeddings/                       # Vector embeddings
│   │   │   │   ├── embedding-service.ts          # ⬜ Generate embeddings
│   │   │   │   └── similarity-search.ts          # ⬜ Semantic similarity
│   │   │   │
│   │   │   ├── llm/                              # LLM provider abstractions
│   │   │   │   ├── openai.provider.ts            # ⬜ OpenAI GPT-4
│   │   │   │   ├── anthropic.provider.ts         # ⬜ Anthropic Claude
│   │   │   │   └── llm-interface.ts              # ⬜ Common interface
│   │   │   │
│   │   │   └── citation/                         # Citation extraction
│   │   │       ├── extractor.ts                  # ⬜ Extract citations from text
│   │   │       └── linker.ts                     # ⬜ Link citations to sources
│   │   │
│   │   └── tests/                                # Tests
│   │
│   ├── semantic-layer/                           # Verifiable Fact Layer & Knowledge Graph (Layer 2)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   │
│   │   │   ├── fact-layer/                       # Verifiable Fact Layer
│   │   │   │   ├── fact-store.ts                 # ⬜ Fact storage (PostgreSQL)
│   │   │   │   ├── fact-query.ts                 # ⬜ Query facts
│   │   │   │   └── fact-validator.ts             # ⬜ Validate fact integrity
│   │   │   │
│   │   │   ├── knowledge-graph/                  # Knowledge Graph
│   │   │   │   ├── graph-client.ts               # ⬜ Neo4j/ArangoDB client
│   │   │   │   ├── graph-builder.ts              # ⬜ Build graph relationships
│   │   │   │   └── graph-query.ts                # ⬜ Query graph
│   │   │   │
│   │   │   └── indexing/                         # Vector indexing
│   │   │       ├── vector-store.ts               # ⬜ Pinecone/Weaviate client
│   │   │       ├── indexer.ts                    # ⬜ Index documents
│   │   │       └── search.ts                     # ⬜ Semantic search
│   │   │
│   │   └── tests/                                # Tests
│   │
│   ├── data-plane/                               # Document Ingestion & Storage (Layer 1)
│   │   ├── CLAUDE.md                             # ✅ Package rules (template)
│   │   ├── package.json                          # ⬜ To be created
│   │   ├── tsconfig.json                         # ⬜ To be created
│   │   │
│   │   ├── src/                                  # Source code
│   │   │   ├── index.ts                          # ⬜ Main exports
│   │   │   │
│   │   │   ├── ingestion/                        # Document ingestion
│   │   │   │   ├── ingestion-pipeline.ts         # ⬜ Main pipeline
│   │   │   │   ├── file-processor.ts             # ⬜ Process uploaded files
│   │   │   │   └── metadata-extractor.ts         # ⬜ Extract metadata
│   │   │   │
│   │   │   ├── parsers/                          # Document parsers
│   │   │   │   ├── pdf.parser.ts                 # ⬜ PDF parsing (pdf-parse)
│   │   │   │   ├── xlsx.parser.ts                # ⬜ XLSX parsing (xlsx)
│   │   │   │   ├── email.parser.ts               # ⬜ Email parsing (mailparser)
│   │   │   │   └── parser-interface.ts           # ⬜ Common interface
│   │   │   │
│   │   │   ├── storage/                          # File storage
│   │   │   │   ├── s3.client.ts                  # ⬜ AWS S3 client
│   │   │   │   ├── upload.ts                     # ⬜ Upload files
│   │   │   │   └── download.ts                   # ⬜ Download files
│   │   │   │
│   │   │   └── ocr/                              # OCR processing
│   │   │       ├── ocr-service.ts                # ⬜ Tesseract.js wrapper
│   │   │       └── image-preprocessor.ts         # ⬜ Prepare images for OCR
│   │   │
│   │   └── tests/                                # Tests
│   │
│   └── agents/                                   # Agentic Orchestration Layer (Layer 4)
│       ├── CLAUDE.md                             # ✅ Package rules (template)
│       ├── package.json                          # ⬜ To be created
│       ├── tsconfig.json                         # ⬜ To be created
│       │
│       ├── src/                                  # Source code
│       │   ├── index.ts                          # ⬜ Main exports
│       │   │
│       │   ├── orchestrator/                     # Agent orchestration
│       │   │   ├── orchestrator.ts               # ⬜ Main orchestrator
│       │   │   ├── agent-manager.ts              # ⬜ Manage agent lifecycle
│       │   │   └── workflow-executor.ts          # ⬜ Execute workflows
│       │   │
│       │   ├── agents/                           # Agent implementations
│       │   │   ├── sourcing-agent.ts             # ⬜ Sourcing Agent (Module 2)
│       │   │   ├── pipeline-os-agent.ts          # ⬜ Pipeline OS Agent (Module 3)
│       │   │   ├── diligence-agent.ts            # ⬜ Diligence Agent (Module 4)
│       │   │   ├── generator-agent.ts            # ⬜ Generator Agent (Module 5)
│       │   │   └── agent-interface.ts            # ⬜ Common agent interface
│       │   │
│       │   └── workflows/                        # Workflow definitions
│       │       ├── sourcing.workflow.ts          # ⬜ Sourcing workflow
│       │       ├── diligence-qa.workflow.ts      # ⬜ Diligence Q&A workflow
│       │       └── generation.workflow.ts        # ⬜ Material generation workflow
│       │
│       └── tests/                                # Tests
│
├── features/                                     # Domain Modules (5 features)
│   │
│   ├── command-center/                           # Module 1: Hive Command Center
│   │   ├── CLAUDE.md                             # ✅ Feature rules (template)
│   │   ├── doc.md                                # ✅ Technical documentation (empty)
│   │   │
│   │   ├── backend/                              # Backend code
│   │   │   ├── routes/                           # API routes
│   │   │   │   └── command-center.routes.ts      # ⬜ Command Center routes
│   │   │   │
│   │   │   ├── services/                         # Business logic
│   │   │   │   ├── dashboard.service.ts          # ⬜ Dashboard service
│   │   │   │   ├── tasks.service.ts              # ⬜ AI Tasks service
│   │   │   │   └── activity.service.ts           # ⬜ Activity feed service
│   │   │   │
│   │   │   ├── controllers/                      # Request controllers
│   │   │   │   └── command-center.controller.ts  # ⬜ Controller
│   │   │   │
│   │   │   └── tests/                            # Tests
│   │   │
│   │   └── frontend/                             # Frontend code
│   │       ├── components/                       # UI components
│   │       │   ├── ConversationalAIBar.tsx       # ⬜ TIC Query bar
│   │       │   ├── MyTasks.tsx                   # ⬜ AI-generated tasks
│   │       │   ├── PipelineHealthWidget.tsx      # ⬜ Honeycomb chart
│   │       │   └── ActivityFeed.tsx              # ⬜ Activity feed
│   │       │
│   │       ├── pages/                            # Page components
│   │       │   └── CommandCenterPage.tsx         # ⬜ Main dashboard page
│   │       │
│   │       └── tests/                            # Tests
│   │
│   ├── discovery/                                # Module 2: Discovery (AI-Native Sourcing)
│   │   ├── CLAUDE.md                             # ✅ Feature rules (template)
│   │   ├── doc.md                                # ✅ Technical documentation (empty)
│   │   │
│   │   ├── backend/                              # Backend code
│   │   │   ├── routes/                           # API routes
│   │   │   │   └── discovery.routes.ts           # ⬜ Discovery routes
│   │   │   │
│   │   │   ├── services/                         # Business logic
│   │   │   │   ├── sourcing-agent.service.ts     # ⬜ Natural language sourcing
│   │   │   │   ├── lookalike.service.ts          # ⬜ Lookalike discovery
│   │   │   │   └── market-map.service.ts         # ⬜ Market map generation
│   │   │   │
│   │   │   ├── controllers/                      # Request controllers
│   │   │   │   └── discovery.controller.ts       # ⬜ Controller
│   │   │   │
│   │   │   └── tests/                            # Tests
│   │   │
│   │   └── frontend/                             # Frontend code
│   │       ├── components/                       # UI components
│   │       │   ├── SearchBar.tsx                 # ⬜ Natural language search
│   │       │   ├── TargetList.tsx                # ⬜ Search results
│   │       │   ├── MarketMap.tsx                 # ⬜ Hexagonal market map
│   │       │   └── LookalikeDiscovery.tsx        # ⬜ Lookalike feature
│   │       │
│   │       ├── pages/                            # Page components
│   │       │   └── DiscoveryPage.tsx             # ⬜ Discovery workspace
│   │       │
│   │       └── tests/                            # Tests
│   │
│   ├── deals/                                    # Module 3: Deals (Interactive Pipeline OS)
│   │   ├── CLAUDE.md                             # ✅ Feature rules (template)
│   │   ├── doc.md                                # ✅ Technical documentation (empty)
│   │   │
│   │   ├── backend/                              # Backend code
│   │   │   ├── routes/                           # API routes
│   │   │   │   └── deals.routes.ts               # ⬜ Deals routes
│   │   │   │
│   │   │   ├── services/                         # Business logic
│   │   │   │   ├── deals.service.ts              # ⬜ Core deal CRUD
│   │   │   │   ├── pipeline-os-agent.service.ts  # ⬜ AI pipeline agent
│   │   │   │   └── fact-sheet.service.ts         # ⬜ Verifiable Fact Sheet
│   │   │   │
│   │   │   ├── controllers/                      # Request controllers
│   │   │   │   └── deals.controller.ts           # ⬜ Controller
│   │   │   │
│   │   │   └── tests/                            # Tests
│   │   │
│   │   └── frontend/                             # Frontend code
│   │       ├── components/                       # UI components
│   │       │   ├── kanban-view/                  # Kanban components
│   │       │   │   ├── KanbanBoard.tsx           # ⬜ Board container
│   │       │   │   ├── KanbanColumn.tsx          # ⬜ Stage columns
│   │       │   │   └── DealCard.tsx              # ⬜ Deal cards
│   │       │   │
│   │       │   ├── list-view/                    # List components
│   │       │   │   └── DealList.tsx              # ⬜ Table view
│   │       │   │
│   │       │   └── deal-360/                     # Deal 360° components
│   │       │       ├── Deal360View.tsx           # ⬜ Main container
│   │       │       ├── OverviewTab.tsx           # ⬜ Overview tab
│   │       │       ├── DiligenceTab.tsx          # ⬜ Diligence tab
│   │       │       ├── DocumentsTab.tsx          # ⬜ Documents tab
│   │       │       ├── ActivityTab.tsx           # ⬜ Activity tab
│   │       │       └── VerifiableFactSheet.tsx   # ⬜ Fact sheet with citations
│   │       │
│   │       ├── pages/                            # Page components
│   │       │   ├── DealsPage.tsx                 # ⬜ Pipeline view page
│   │       │   └── DealDetailPage.tsx            # ⬜ Deal 360° page
│   │       │
│   │       └── tests/                            # Tests
│   │
│   ├── diligence/                                # Module 4: Diligence Room (AI-Native VDR)
│   │   ├── CLAUDE.md                             # ✅ Feature rules (template)
│   │   ├── doc.md                                # ✅ Technical documentation (empty)
│   │   │
│   │   ├── backend/                              # Backend code
│   │   │   ├── routes/                           # API routes
│   │   │   │   └── diligence.routes.ts           # ⬜ Diligence routes
│   │   │   │
│   │   │   ├── services/                         # Business logic
│   │   │   │   ├── diligence-agent.service.ts    # ⬜ Diligence agent
│   │   │   │   ├── automated-qa.service.ts       # ⬜ Automated Q&A
│   │   │   │   ├── risk-scanner.service.ts       # ⬜ Risk scanning
│   │   │   │   └── vdr-ingestion.service.ts      # ⬜ VDR upload & processing
│   │   │   │
│   │   │   ├── controllers/                      # Request controllers
│   │   │   │   └── diligence.controller.ts       # ⬜ Controller
│   │   │   │
│   │   │   └── tests/                            # Tests
│   │   │
│   │   └── frontend/                             # Frontend code
│   │       ├── components/                       # UI components
│   │       │   ├── VDRUploader.tsx               # ⬜ Drag-and-drop uploader
│   │       │   ├── DocumentExplorer.tsx          # ⬜ File explorer
│   │       │   ├── QAInterface.tsx               # ⬜ Q&A interface
│   │       │   ├── RiskSummary.tsx               # ⬜ Risk summary panel
│   │       │   └── CitationModal.tsx             # ⬜ Citation modal
│   │       │
│   │       ├── pages/                            # Page components
│   │       │   └── DiligenceRoomPage.tsx         # ⬜ VDR workspace
│   │       │
│   │       └── tests/                            # Tests
│   │
│   └── generator/                                # Module 5: Generator (Auditable Material Creation)
│       ├── CLAUDE.md                             # ✅ Feature rules (template)
│       ├── doc.md                                # ✅ Technical documentation (empty)
│       │
│       ├── backend/                              # Backend code
│       │   ├── routes/                           # API routes
│       │   │   └── generator.routes.ts           # ⬜ Generator routes
│       │   │
│       │   ├── services/                         # Business logic
│       │   │   ├── generator-agent.service.ts    # ⬜ Generator agent
│       │   │   ├── ic-deck-generator.service.ts  # ⬜ IC deck generation
│       │   │   ├── loi-drafter.service.ts        # ⬜ LOI drafting
│       │   │   └── citation-linker.service.ts    # ⬜ Golden citations
│       │   │
│       │   ├── controllers/                      # Request controllers
│       │   │   └── generator.controller.ts       # ⬜ Controller
│       │   │
│       │   └── tests/                            # Tests
│       │
│       └── frontend/                             # Frontend code
│           ├── components/                       # UI components
│           │   ├── TemplateSelector.tsx          # ⬜ Template selection
│           │   ├── GenerationProgress.tsx        # ⬜ Progress indicator
│           │   ├── PreviewPanel.tsx              # ⬜ Preview generated content
│           │   └── CitationLinker.tsx            # ⬜ Manage golden citations
│           │
│           ├── pages/                            # Page components
│           │   └── GeneratorPage.tsx             # ⬜ Generator workspace
│           │
│           └── tests/                            # Tests
│
├── docs/                                         # Documentation
│   ├── PRD.md                                    # ✅ Root Product Requirements (COMPLETE)
│   │
│   ├── prds/                                     # Feature PRDs
│   │   ├── command-center.md                     # ✅ Module 1 PRD (COMPLETE)
│   │   ├── discovery.md                          # ✅ Module 2 PRD (COMPLETE)
│   │   ├── deals.md                              # ✅ Module 3 PRD (COMPLETE)
│   │   ├── diligence.md                          # ✅ Module 4 PRD (COMPLETE)
│   │   └── generator.md                          # ✅ Module 5 PRD (COMPLETE)
│   │
│   ├── architecture/                             # Architecture documentation
│   │   ├── 7-layer-architecture.md               # ✅ Overview (empty)
│   │   ├── data-plane.md                         # ✅ Layer 1 (empty)
│   │   ├── semantic-layer.md                     # ✅ Layer 2 (empty)
│   │   ├── tic-core.md                           # ✅ Layer 3 (empty)
│   │   ├── agentic-layer.md                      # ✅ Layer 4 (empty)
│   │   ├── experience-layer.md                   # ✅ Layer 5 (empty)
│   │   ├── governance-layer.md                   # ✅ Layer 6 (empty)
│   │   ├── api-layer.md                          # ✅ Layer 7 (empty)
│   │   └── decisions/                            # Architecture Decision Records
│   │       └── .gitkeep                          # Placeholder
│   │
│   └── api/                                      # API documentation
│       └── openapi.yaml                          # ⬜ OpenAPI specification
│
├── context/                                      # Design Governance
│   ├── design-principles.md                      # ✅ Complete UX principles
│   └── style-guide.md                            # ✅ Complete design system (The Intelligent Hive)
│
├── CLAUDE.md                                     # ✅ Root governance document (COMPLETE)
├── plan.md                                       # ✅ Development plan
├── CHANGELOG.md                                  # ✅ User-visible changes log
├── ERROR_LOG.md                                  # ✅ Error tracking log
├── README.md                                     # ✅ Project overview
├── QUICK_START.md                                # ✅ Quick start guide
├── PROJECT_SETUP_COMPLETE.md                     # ✅ Setup completion report
├── SETUP_COMPLETION_CHECKLIST.md                 # ✅ Detailed checklist
├── PROJECT_STRUCTURE.md                          # ✅ This file
│
├── .gitignore                                    # ✅ Git ignore rules
├── .prettierrc                                   # ✅ Prettier configuration
├── .eslintrc.js                                  # ✅ ESLint configuration
├── LICENSE                                       # ✅ MIT License
│
├── package.json                                  # ✅ Root workspace configuration
├── pnpm-workspace.yaml                           # ✅ PNPM workspace configuration
├── tsconfig.json                                 # ✅ Root TypeScript configuration
├── docker-compose.yml                            # ✅ Docker services (Postgres, Redis)
│
├── .env.example                                  # ⬜ Environment variables template
├── .env                                          # ⬜ Local environment (gitignored)
│
├── Trato Hive Product & Design Specification.md # ✅ Source document
└── claude_code_2025_solo_dev_playbook_cli_plan_mode_claude.md # ✅ Source document
```

---

## 📊 File Count Summary

### Created Files (✅)
- **Root governance:** 1 (CLAUDE.md)
- **.claude/ workspace:** 4 (context, rules, prompts, settings) + 4 agents = 8
- **Context:** 2 (design-principles, style-guide)
- **Documentation:** 7 (README, QUICK_START, PROJECT_SETUP_COMPLETE, SETUP_COMPLETION_CHECKLIST, PROJECT_STRUCTURE, plan, Trato Hive spec, playbook)
- **Logging:** 2 (CHANGELOG, ERROR_LOG)
- **Configuration:** 6 (package.json, pnpm-workspace, tsconfig, eslintrc, prettierrc, docker-compose)
- **Root files:** 2 (.gitignore, LICENSE)
- **PRDs:** 6 (root + 5 features - templates/empty)
- **Architecture:** 9 (8 docs + decisions folder - empty)
- **Apps CLAUDE.md:** 2 (web, api - templates)
- **Packages CLAUDE.md:** 8 (ui, db, auth, shared, ai-core, semantic-layer, data-plane, agents - templates)
- **Features CLAUDE.md + doc.md:** 10 (5 × 2 - templates)

**Total Created:** ~67 files

### To Be Created (⬜)
- **App package.json:** 2 (web, api)
- **App tsconfig.json:** 2 (web, api)
- **App configs:** ~10 (next.config, tailwind.config, playwright.config, etc.)
- **Package package.json:** 8 (one per package)
- **Package tsconfig.json:** 8 (one per package)
- **Environment files:** 2 (.env.example, .env)
- **GitHub workflows:** 3 (ci, design-review, security-scan)
- **Source code files:** ~200+ (all .ts/.tsx implementation files)
- **Test files:** ~100+ (all .test.ts/.test.tsx files)
- **Storybook files:** ~20 (stories + config)

**Total To Be Created:** ~355+ files

### Total Project Files (when complete)
**~420+ files** across the entire monorepo structure

---

## 🎨 Color Coding Legend

- ✅ **Created & Complete** - File exists with content
- ⬜ **To Be Created** - File/directory exists but empty or needs implementation
- 📁 **Directory** - Folder structure

---

## 📦 Package Breakdown by Layer

### Layer 1 - Data Plane
- `packages/data-plane/` (Document ingestion, OCR, S3 storage)

### Layer 2 - Semantic Layer
- `packages/semantic-layer/` (Verifiable Fact Layer, Knowledge Graph, Vector DB)

### Layer 3 - TIC Core
- `packages/ai-core/` (Trato Intelligence Core, LLM orchestration, embeddings)

### Layer 4 - Agentic Layer
- `packages/agents/` (AI workflow agents: Sourcing, Pipeline OS, Diligence, Generator)

### Layer 5 - Experience Layer
- `apps/web/` (Next.js frontend - UI/UX)
- `apps/api/` (Express backend - API routes)

### Layer 6 - Governance Layer
- `packages/auth/` (Authentication & authorization)
- `packages/db/` (Database schemas & migrations)

### Layer 7 - API Layer
- `apps/api/src/routes/` (REST API endpoints)

### Cross-Layer
- `packages/shared/` (Types, constants, validators, utilities)
- `packages/ui/` (Shared React components - The Intelligent Hive design system)

---

## 🎯 Feature Breakdown by Module

### Module 1 - Command Center
- `features/command-center/` (Dashboard, AI query bar, My Tasks, activity feed)

### Module 2 - Discovery
- `features/discovery/` (AI-Native sourcing, lookalike discovery, market maps)

### Module 3 - Deals
- `features/deals/` (Pipeline OS, Kanban/List views, Deal 360°, Verifiable Fact Sheet)

### Module 4 - Diligence
- `features/diligence/` (AI-Native VDR, automated Q&A, risk scanning, citation modals)

### Module 5 - Generator
- `features/generator/` (IC deck generation, LOI drafts, golden citations)

---

## 🔗 Key File References

### Must Read First
1. `CLAUDE.md` - Root governance (ALWAYS read first)
2. `README.md` - Project overview
3. `QUICK_START.md` - Getting started guide

### Planning & Tracking
4. `plan.md` - Current development plan
5. `SETUP_COMPLETION_CHECKLIST.md` - Detailed task checklist
6. `CHANGELOG.md` - User-visible changes
7. `ERROR_LOG.md` - Error tracking

### Design System
8. `context/design-principles.md` - UX principles
9. `context/style-guide.md` - The Intelligent Hive design system

### Product Requirements
10. `docs/PRD.md` - Root product requirements
11. `docs/prds/*.md` - Feature-level PRDs

### Architecture
12. `docs/architecture/7-layer-architecture.md` - Architecture overview
13. `docs/architecture/*.md` - Layer-specific documentation

---

**Last Updated:** 2025-11-12
**Total Directories:** ~150+
**Total Files (when complete):** ~420+
**Current Status:** Foundation complete + PRDs finalized → Next: Architecture documentation & package configs
