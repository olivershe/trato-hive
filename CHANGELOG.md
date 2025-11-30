# Changelog

All notable changes to Trato Hive will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- [Setup] Initial project structure with hybrid monorepo
- [Setup] Claude Code governance with root CLAUDE.md and nested CLAUDE.md files
- [Setup] The Intelligent Hive design system (color tokens, typography, components)
- [Setup] 7-Layer Architecture documentation and mapping
- [Setup] 5 Core Modules structure (command-center, discovery, deals, diligence, generator)
- [Setup] Complete package configuration for all 8 packages (ai-core, agents, auth, data-plane, db, semantic-layer, shared, ui)
- [Setup] Prisma schema implementation with core data models (User, Firm, Deal, Company, Document, Fact, AuditLog)
- [Setup] Placeholder implementations for all package entry points with TODO markers
- [Setup] TypeScript build infrastructure with dual CJS/ESM output for all packages
- [Setup] AI stack integration (Claude Sonnet 4.5, LangChain.js, Vercel AI SDK, Pinecone, OpenAI embeddings)
- [Setup] Job queue system with BullMQ and Redis integration
- [Setup] Document processing foundation with Reducto AI client placeholder

### Changed
- [Setup] Module resolution changed from "node" to "bundler" for better ESM support
- [Setup] All package tsconfig files configured with incremental: false and composite: false

### Fixed
- [Setup] Resolved all TypeScript compilation errors across 8 packages
- [Setup] Added missing ioredis dependency to data-plane and agents packages
- [Setup] Fixed LangChain.js ChatOpenAI API usage with proper HumanMessage objects
- [Setup] Corrected unused parameter warnings by following placeholder pattern conventions

### Security

## Guidelines

### When to update CHANGELOG.md
- User-visible changes (new features, UI updates, behavior changes)
- API contract changes (breaking or non-breaking)
- Database migrations
- Risky dependency upgrades (major versions, security patches)

### Format
```markdown
### [Added/Changed/Fixed/Security]
- [Module] Description with rationale (#PR-link)
```

### Examples
- [Deals] Implement Verifiable Fact Sheet with citation links (#123)
- [API] Add pagination to /api/v1/deals endpoint (#145)
- [Security] Upgrade express to 4.18.3 to fix CVE-2024-XXXX (#167)
