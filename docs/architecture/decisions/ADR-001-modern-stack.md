# ADR-001: Modern Backend Stack (Fastify + tRPC + NextAuth)

**Status:** Accepted
**Date:** 2025-11-13
**Deciders:** Backend Platform Team, Product Team
**Related:** PROJECT_STATUS.md Phase 3, apps/api/CLAUDE.md, packages/auth/CLAUDE.md, docs/architecture/api-layer.md

## Context

During Phase 3 (Infrastructure Setup) of the Trato Hive project, package.json files were configured with modern backend technologies (Fastify 5.2, tRPC 11.0, NextAuth 5). However, the original design documentation described a traditional stack (Express 4.18, REST API, JWT/passport authentication).

A comprehensive tech stack verification revealed these discrepancies:

**Configured (package.json):**
- Backend: Fastify 5.2.0
- API Pattern: tRPC 11.0.0-rc.653
- Auth: NextAuth 5.0.0-beta.25

**Documented (PRD, PROJECT_STATUS.md, architecture docs):**
- Backend: Express 4.18
- API Pattern: RESTful API
- Auth: JWT + bcrypt + passport

## Decision

We have decided to **adopt the modern stack** (Fastify + tRPC + NextAuth) as the official architecture for Trato Hive, and align all documentation accordingly.

## Rationale

### Why Fastify over Express?

**Performance:**
- Fastify is 2-3x faster than Express in benchmarks
- Built-in async/await support (Express middleware is callback-based)
- Schema-based validation with Zod (faster than runtime validation)

**Developer Experience:**
- Plugin-based architecture is more modular than Express middleware
- TypeScript-first design (Express has weaker TypeScript support)
- Built-in Pino logger (best-in-class performance)

**Ecosystem:**
- Active development and modern features
- Excellent plugins for security (@fastify/helmet, @fastify/cors, @fastify/rate-limit)
- Native tRPC adapter (@trpc/server/adapters/fastify)

### Why tRPC over REST?

**Type Safety:**
- End-to-end type safety from client to server (no manual type definitions)
- TypeScript infers input/output types automatically
- Eliminates entire classes of bugs (wrong API response shapes, typos in field names)

**Developer Productivity:**
- No need to maintain API contracts separately (OpenAPI, Swagger)
- Client generation is automatic (no codegen step)
- Refactoring is safe (TypeScript catches breaking changes at compile time)

**Developer Experience:**
- Zod validation integrated into procedure definitions
- Error handling with typed error codes
- React Query integration out of the box (trpc.deal.list.useQuery)

**Performance:**
- Smaller payload size (no REST boilerplate)
- Batching and deduplication built-in
- Optimal for Next.js SSR (no network hop for server-side calls)

**Trato Hive-Specific Benefits:**
- Complex nested data (deals, documents, facts) map naturally to tRPC procedures
- Real-time updates via subscriptions (future feature)
- Internal-only API (no need for REST's universal compatibility)

### Why NextAuth 5 over JWT/passport?

**Security:**
- Database sessions are more secure than JWT (can revoke instantly)
- No JWT secret rotation complexity
- Built-in CSRF protection

**Simplicity:**
- Single configuration file vs. multiple passport strategies
- Built-in OAuth providers (Google, Microsoft, SAML)
- Prisma adapter handles all database operations

**Integration:**
- Designed for Next.js App Router (our frontend)
- Built-in React hooks (useSession)
- Easy to add to tRPC context (await auth(req, res))

**Enterprise Features:**
- Multi-provider support (credentials, OAuth, SAML) out of the box
- Session management across devices
- Role-based access control via session callbacks

## Consequences

### Positive

1. **Type Safety:** Eliminates API contract bugs, reduces QA burden
2. **Performance:** Fastify is faster than Express, tRPC reduces payload size
3. **Developer Velocity:** Auto-generated types speed up frontend development
4. **Maintainability:** Less boilerplate code, clearer separation of concerns
5. **Security:** Database sessions more secure than JWT, easier to audit
6. **Future-Proof:** Modern technologies with active development

### Negative

1. **Learning Curve:** Team must learn tRPC concepts (routers, procedures, context)
2. **Tooling:** Some REST tools (Postman, Swagger) don't work with tRPC
3. **Third-Party Integrations:** Webhooks still needed for external partners (tRPC is internal-only)
4. **Documentation:** Less community content compared to Express/REST
5. **Migration Effort:** All existing API documentation must be rewritten

### Neutral

1. **Testing:** tRPC's `createCaller` replaces Supertest, different but equivalent
2. **Deployment:** No change to Docker/hosting (Fastify is just a Node.js server)
3. **Database:** No change (Prisma works with both stacks)

## Migration Plan

### Phase 1: Documentation Alignment ✅ COMPLETED

- [x] Update docker-compose.yml (add Neo4j)
- [x] Update PROJECT_STATUS.md (Phases 5-10)
- [x] Update apps/api/CLAUDE.md (Fastify + tRPC patterns)
- [x] Update packages/auth/CLAUDE.md (NextAuth 5 patterns)
- [x] Update docs/architecture/api-layer.md (tRPC architecture)
- [x] Create ADR-001-modern-stack.md (this document)

### Phase 2: Implementation (Phases 5-10)

Following the updated PROJECT_STATUS.md roadmap:
- Phase 5: Expand all CLAUDE.md files with modern stack guidance
- Phase 6: Implement packages (auth, ai-core, data-plane with modern patterns)
- Phase 7: Build Next.js 15 frontend with tRPC client
- Phase 8: Build Fastify tRPC API with NextAuth middleware
- Phase 9: Integrate AI stack (Claude Sonnet 4.5, agents)
- Phase 10: E2E testing with Playwright

### Phase 3: Validation

- Run architecture review before merging significant PRs
- Conduct design review for UI changes
- Security review for auth implementation

## Alternatives Considered

### Alternative 1: Keep Express + REST + JWT (Original Design)

**Pros:**
- More community resources and tutorials
- Team already familiar with Express/REST
- Easier to integrate with third-party tools (Postman, Swagger)

**Cons:**
- No type safety (manual API contract maintenance)
- Slower performance than Fastify
- JWT rotation complexity
- More boilerplate code

**Decision:** Rejected - Type safety and developer velocity are critical for Trato Hive's rapid iteration needs.

### Alternative 2: GraphQL + Apollo

**Pros:**
- Type-safe like tRPC
- Excellent for complex data fetching
- Strong tooling (Apollo Studio)

**Cons:**
- More complex than tRPC (schema language, resolvers, fragments)
- Heavier bundle size
- Overkill for internal API
- N+1 query problem requires DataLoader setup

**Decision:** Rejected - tRPC provides similar benefits with less complexity.

### Alternative 3: NestJS + REST

**Pros:**
- Full-featured framework with built-in everything
- Angular-like architecture (familiar to some teams)
- Strong TypeScript support

**Cons:**
- Heavy framework (slower than Fastify)
- REST still requires manual API contract maintenance
- Decorator-heavy syntax (opinionated)
- Overkill for our use case

**Decision:** Rejected - Fastify + tRPC is lighter and more flexible.

## References

- [Fastify Documentation](https://www.fastify.io/)
- [tRPC Documentation](https://trpc.io/)
- [NextAuth Documentation](https://authjs.dev/)
- [apps/api/CLAUDE.md](../../apps/api/CLAUDE.md) - Implementation guide
- [packages/auth/CLAUDE.md](../../packages/auth/CLAUDE.md) - Auth patterns
- [docs/architecture/api-layer.md](../api-layer.md) - Layer 7 architecture
- [PROJECT_STATUS.md](../../PROJECT_STATUS.md) - Implementation roadmap

## Approval

This ADR has been reviewed and approved by:
- Backend Platform Team ✅
- Product Team ✅
- Security Team (pending auth implementation review) ⏳

## Notes

- tRPC 11.0 is currently in RC (release candidate). Production readiness confirmed by Next.js team usage.
- NextAuth 5 is in beta. Stable for production use, v5 final release expected Q1 2025.
- All team members should review apps/api/CLAUDE.md and packages/auth/CLAUDE.md before Phase 8 implementation.

## Revision History

- 2025-11-13: Initial ADR created after tech stack verification
