# Backend API Rules (apps/api)

**Parent:** Root CLAUDE.md
**Purpose:** Backend API implementation guidance for Fastify + tRPC server
**Last Updated:** 2025-11-16

---

## Related Documentation

**Prerequisites (Read First):**
- `/CLAUDE.md` - Root project rules
- `/docs/architecture/api-layer.md` - Layer 7 architecture specification
- `/Trato Hive Product & Design Specification.md` - Product context

**Related Files:**
- `/apps/web/CLAUDE.md` - Frontend integration patterns
- `/packages/db/CLAUDE.md` - Database access patterns (when created)
- `/packages/auth/CLAUDE.md` - Authentication setup (when created)
- `/packages/*/CLAUDE.md` - Package integration guides (when created)

---

## 1. Purpose

Fastify tRPC API server for all 5 Trato Hive modules (Command Center, Discovery, Deals, Diligence, Generator). This API provides type-safe, end-to-end typed procedures for the Next.js frontend and serves as Layer 7 (API Layer) in the 7-Layer Architecture.

## 2. Technology Stack

**Core:**
- Node.js 20 LTS
- Fastify 5.2.0
- tRPC 11.0.0-rc.653 (server + Fastify adapter)
- TypeScript 5.6.3

**Integrations:**
- @trato-hive/db (Prisma ORM)
- @trato-hive/auth (NextAuth 5 sessions)
- @trato-hive/ai-core (LLM queries)
- @trato-hive/agents (Document/Diligence agents)
- @trato-hive/data-plane (S3, BullMQ)
- @trato-hive/semantic-layer (Facts, vector search)

**Testing:**
- Vitest for unit and integration tests
- tRPC's `createCaller` for procedure testing

## 3. Architecture

### tRPC Request Flow

```
Client Request
    ↓
Fastify HTTP Server
    ↓
tRPC Fastify Adapter
    ↓
tRPC Router
    ↓
tRPC Procedure (query/mutation)
    ↓
tRPC Middleware (auth, logging, error handling)
    ↓
Service Layer (business logic)
    ↓
Package Layer (@trato-hive/*)
    ↓
Database/External APIs
```

### Directory Structure

```
apps/api/src/
├── index.ts              # Fastify server + tRPC adapter
├── routers/
│   ├── index.ts         # Root app router
│   ├── deal.ts          # Deal procedures
│   ├── company.ts       # Company procedures
│   ├── user.ts          # User procedures
│   ├── document.ts      # Document procedures
│   └── fact.ts          # Fact procedures
├── services/
│   ├── deal-service.ts
│   ├── company-service.ts
│   ├── user-service.ts
│   ├── document-service.ts
│   └── fact-service.ts
├── middleware/
│   ├── auth.ts          # protectedProcedure, requireRole, requireFirm
│   └── logging.ts       # Request/response logging
└── utils/
    ├── trpc.ts          # tRPC instance, context, error formatter
    └── errors.ts        # TRPCError helpers
```

## 4. tRPC Design Principles

### Routers vs Procedures

- **Routers** group related procedures (e.g., `dealRouter` contains all deal-related procedures)
- **Procedures** are individual API endpoints (`.query()` for reads, `.mutation()` for writes)
- **No business logic in routers/procedures** - delegate to services

### Input Validation

All inputs validated via Zod schemas:

```typescript
// routers/deal.ts
export const dealRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      filter: z.object({
        status: z.enum(['active', 'closed']).optional(),
        stage: z.string().optional(),
      }).optional(),
      sort: z.object({
        field: z.string(),
        order: z.enum(['asc', 'desc']),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await dealService.listDeals(input, ctx.session);
    }),
});
```

### Type Safety

- Client automatically infers input/output types
- No need for manual type definitions
- Example client usage:

```typescript
// Frontend
const { data, isLoading } = trpc.deal.list.useQuery({
  page: 1,
  limit: 20,
  filter: { status: 'active' },
});
```

### Error Handling

Use tRPC error codes:

```typescript
import { TRPCError } from '@trpc/server';

// In service layer
if (!deal) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Deal not found',
  });
}

if (!canAccessDeal(session, dealId)) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'You do not have access to this deal',
  });
}
```

**Available error codes:**
- `UNAUTHORIZED` - No valid session
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input
- `INTERNAL_SERVER_ERROR` - Unexpected error

## 5. Authentication & Authorization

### NextAuth Session in tRPC Context

```typescript
// utils/trpc.ts
import { auth } from '@trato-hive/auth';

export const createContext = async ({ req, res }) => {
  const session = await auth(req, res);

  return {
    session,
    prisma: db, // from @trato-hive/db
  };
};
```

### Protected Procedures

```typescript
// middleware/auth.ts
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
```

### Role-Based Access Control

```typescript
// middleware/auth.ts
export const requireRole = (allowedRoles: string[]) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = ctx.session.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return next();
  });
};

// Usage
export const dealRouter = router({
  delete: requireRole(['Admin', 'Manager'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await dealService.deleteDeal(input.id, ctx.session);
    }),
});
```

### Multi-Tenancy Enforcement

```typescript
// middleware/auth.ts
export const requireFirm = protectedProcedure.use(async ({ ctx, next }) => {
  const firmId = ctx.session.user.firmId;

  if (!firmId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No firm association' });
  }

  return next({
    ctx: {
      ...ctx,
      firmId,
    },
  });
});
```

## 6. Fastify Configuration

### Server Setup

```typescript
// index.ts
import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

const fastify = Fastify({
  logger: true, // Pino logger
});

// Security plugins
await fastify.register(helmet);
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// tRPC plugin
await fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
  },
});

fastify.listen({ port: 4000, host: '0.0.0.0' });
```

### Health Check Endpoint

```typescript
// index.ts
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});
```

## 7. Environment Variables

All sensitive configuration must be stored in environment variables, never in code.

### Required Environment Variables

Create a `.env` file in `apps/api/` (never commit this file):

```bash
# .env (apps/api/)

# =============================================
# Database
# =============================================
DATABASE_URL="postgresql://user:password@localhost:5432/trato_hive_dev"

# =============================================
# Redis (for caching and BullMQ)
# =============================================
REDIS_URL="redis://localhost:6379"

# =============================================
# NextAuth Integration
# =============================================
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# =============================================
# AI Services (Layer 3: TIC Core)
# =============================================
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# =============================================
# AWS S3 Storage (Layer 1: Data Plane)
# =============================================
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
S3_BUCKET="trato-hive-documents-dev"

# =============================================
# Server Configuration
# =============================================
NODE_ENV="development"
PORT="4000"
HOST="0.0.0.0"
LOG_LEVEL="info"  # debug, info, warn, error

# =============================================
# Frontend URL (for CORS)
# =============================================
FRONTEND_URL="http://localhost:3000"

# =============================================
# Rate Limiting
# =============================================
RATE_LIMIT_MAX="100"           # requests per window
RATE_LIMIT_WINDOW="60000"      # window in ms (1 minute)

# =============================================
# Background Jobs (BullMQ)
# =============================================
BULLMQ_CONCURRENCY="5"         # concurrent jobs per worker
```

### Environment-Specific Configs

**Development (`.env.development`):**
```bash
NODE_ENV="development"
DATABASE_URL="postgresql://localhost:5432/trato_hive_dev"
LOG_LEVEL="debug"
FRONTEND_URL="http://localhost:3000"
```

**Staging (`.env.staging`):**
```bash
NODE_ENV="staging"
DATABASE_URL="postgresql://staging-db.internal:5432/trato_hive_staging"
LOG_LEVEL="info"
FRONTEND_URL="https://staging.tratohive.com"
```

**Production (`.env.production`):**
```bash
NODE_ENV="production"
DATABASE_URL="postgresql://prod-db.internal:5432/trato_hive_prod"
LOG_LEVEL="warn"
FRONTEND_URL="https://app.tratohive.com"
```

### Loading Environment Variables

Use `@fastify/env` plugin for validation:

```typescript
// index.ts
import fastifyEnv from '@fastify/env';

const schema = {
  type: 'object',
  required: ['DATABASE_URL', 'REDIS_URL', 'NEXTAUTH_SECRET'],
  properties: {
    NODE_ENV: { type: 'string', default: 'development' },
    PORT: { type: 'number', default: 4000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    DATABASE_URL: { type: 'string' },
    REDIS_URL: { type: 'string' },
    NEXTAUTH_SECRET: { type: 'string' },
    OPENAI_API_KEY: { type: 'string' },
    ANTHROPIC_API_KEY: { type: 'string' },
    AWS_ACCESS_KEY_ID: { type: 'string' },
    AWS_SECRET_ACCESS_KEY: { type: 'string' },
    S3_BUCKET: { type: 'string' },
    FRONTEND_URL: { type: 'string', default: 'http://localhost:3000' },
    LOG_LEVEL: { type: 'string', default: 'info' },
  },
};

await fastify.register(fastifyEnv, {
  schema,
  dotenv: true, // Load from .env file
});

// Access via fastify.config
console.log(fastify.config.DATABASE_URL);
```

### Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use `.env.example` template** - Commit this with placeholder values
3. **Rotate secrets regularly** - Especially NEXTAUTH_SECRET, API keys
4. **Use environment-specific secrets** - Different keys for dev/staging/prod
5. **Validate on startup** - Fail fast if required env vars missing
6. **Use secret management in production** - AWS Secrets Manager, HashiCorp Vault

## 8. Development Workflow

### Initial Setup

1. **Clone repository and install dependencies:**
```bash
git clone <repo-url>
cd Trato\ Hive
pnpm install
```

2. **Start local infrastructure (Postgres, Redis, Neo4j):**
```bash
# From project root
docker-compose up -d
```

3. **Create environment file:**
```bash
cd apps/api
cp .env.example .env
# Edit .env with your local values
```

4. **Generate Prisma client:**
```bash
pnpm --filter @trato-hive/db db:generate
```

5. **Run database migrations:**
```bash
pnpm --filter @trato-hive/db db:migrate
```

6. **Seed development data:**
```bash
pnpm --filter @trato-hive/db db:seed
```

### Running the Dev Server

```bash
# From project root
pnpm --filter api dev

# Or from apps/api/
pnpm dev
```

This starts:
- Fastify server on `http://localhost:4000`
- tRPC endpoints at `http://localhost:4000/trpc`
- Health check at `http://localhost:4000/health`
- Hot reload with `tsx watch`

### Database Workflow

**Create a new migration:**
```bash
pnpm --filter @trato-hive/db db:migrate
# Enter migration name when prompted
```

**View database in Prisma Studio:**
```bash
pnpm --filter @trato-hive/db db:studio
# Opens at http://localhost:5555
```

**Reset database (WARNING: deletes all data):**
```bash
pnpm --filter @trato-hive/db db:push --force-reset
```

**Seed test data:**
```bash
pnpm --filter @trato-hive/db db:seed
```

### Testing Workflow

**Run all tests:**
```bash
pnpm --filter api test
```

**Watch mode (re-run on file changes):**
```bash
pnpm --filter api test:watch
```

**Run specific test file:**
```bash
pnpm --filter api test services/deal-service.test.ts
```

**Check test coverage:**
```bash
pnpm --filter api test --coverage
```

### Debugging with VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Server",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "api", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "envFile": "${workspaceFolder}/apps/api/.env"
    }
  ]
}
```

Set breakpoints in VS Code and press F5 to debug.

### Common Development Tasks Checklist

- [ ] Local services running (`docker-compose up -d`)
- [ ] Database migrations applied (`db:migrate`)
- [ ] Prisma client generated (`db:generate`)
- [ ] Environment variables configured (`.env`)
- [ ] Dev server running (`pnpm dev`)
- [ ] Frontend connected to API (check CORS settings)
- [ ] Tests passing (`pnpm test`)
- [ ] Types checking (`pnpm typecheck`)

## 9. Service Layer Pattern

Services contain business logic and orchestrate package calls:

```typescript
// services/deal-service.ts
import { db } from '@trato-hive/db';
import { extractFactsFromDeal } from '@trato-hive/semantic-layer';
import { TRPCError } from '@trpc/server';

export class DealService {
  async listDeals(input: ListDealsInput, session: Session) {
    const { page, limit, filter, sort } = input;
    const { firmId } = session.user;

    const deals = await db.deal.findMany({
      where: {
        firmId,
        ...(filter?.status && { status: filter.status }),
        ...(filter?.stage && { stage: filter.stage }),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sort ? { [sort.field]: sort.order } : undefined,
    });

    const total = await db.deal.count({
      where: { firmId },
    });

    return {
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDealFactSheet(dealId: string, session: Session) {
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: { documents: true },
    });

    if (!deal || deal.firmId !== session.user.firmId) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    // Use semantic layer to extract verifiable facts
    const facts = await extractFactsFromDeal(dealId);

    return {
      deal,
      facts,
    };
  }
}

export const dealService = new DealService();
```

## 8. Testing Requirements

### Unit Tests for Services

```typescript
// services/__tests__/deal-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { dealService } from '../deal-service';

describe('DealService', () => {
  it('should list deals with pagination', async () => {
    const mockSession = { user: { firmId: 'firm-1', role: 'Analyst' } };
    const result = await dealService.listDeals(
      { page: 1, limit: 20 },
      mockSession
    );

    expect(result.deals).toBeDefined();
    expect(result.pagination.page).toBe(1);
  });
});
```

### Integration Tests for Procedures

```typescript
// routers/__tests__/deal.test.ts
import { describe, it, expect } from 'vitest';
import { appRouter } from '../index';
import { createCallerFactory } from '@trpc/server';

const createCaller = createCallerFactory(appRouter);

describe('dealRouter', () => {
  it('should return deals for authenticated user', async () => {
    const mockSession = { user: { id: 'user-1', firmId: 'firm-1', role: 'Analyst' } };
    const caller = createCaller({ session: mockSession, prisma: db });

    const result = await caller.deal.list({ page: 1, limit: 20 });

    expect(result.deals).toBeDefined();
    expect(result.pagination.total).toBeGreaterThanOrEqual(0);
  });

  it('should throw UNAUTHORIZED for unauthenticated user', async () => {
    const caller = createCaller({ session: null, prisma: db });

    await expect(
      caller.deal.list({ page: 1, limit: 20 })
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
```

**Coverage Requirements:**
- Services: >80% coverage
- Procedures: >70% coverage
- Focus on happy paths and error cases

### E2E Tests with tRPC Client

Test full request/response flow from client perspective:

```typescript
// routers/__tests__/deal.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../index';

describe('Deal Router E2E', () => {
  let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;
  let authToken: string;

  beforeAll(async () => {
    // Start test server
    await startTestServer();

    // Authenticate and get token
    authToken = await authenticateTestUser();

    // Create tRPC client
    client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: 'http://localhost:4001/trpc',
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        }),
      ],
    });
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it('should list deals with pagination', async () => {
    const result = await client.deal.list.query({ page: 1, limit: 20 });

    expect(result.deals).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it('should throw UNAUTHORIZED for invalid token', async () => {
    const unauthClient = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: 'http://localhost:4001/trpc' })],
    });

    await expect(
      unauthClient.deal.list.query({ page: 1, limit: 20 })
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
```

### Mocking External Services

Mock package dependencies to isolate unit tests:

```typescript
// services/__tests__/deal-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dealService } from '../deal-service';

// Mock @trato-hive/semantic-layer
vi.mock('@trato-hive/semantic-layer', () => ({
  extractFactsFromDeal: vi.fn().mockResolvedValue([
    { id: 'fact-1', type: 'revenue', value: '$10M', source: 'doc-1' },
  ]),
}));

// Mock @trato-hive/data-plane
vi.mock('@trato-hive/data-plane', () => ({
  s3Client: {
    getUploadUrl: vi.fn().mockResolvedValue('https://s3.aws.com/upload-url'),
  },
  jobQueue: {
    addJob: vi.fn().mockResolvedValue({ id: 'job-123', status: 'queued' }),
  },
}));

// Mock @trato-hive/db
vi.mock('@trato-hive/db', () => ({
  db: {
    deal: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe('DealService with mocked dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call semantic layer for fact extraction', async () => {
    const { extractFactsFromDeal } = await import('@trato-hive/semantic-layer');

    await dealService.getDealFactSheet('deal-123', mockSession);

    expect(extractFactsFromDeal).toHaveBeenCalledWith('deal-123');
  });
});
```

### Testing Authentication & Authorization

```typescript
// middleware/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest';
import { protectedProcedure, requireRole } from '../auth';

describe('Authentication Middleware', () => {
  it('should allow authenticated requests', async () => {
    const mockContext = {
      session: { user: { id: 'user-1', role: 'Analyst', firmId: 'firm-1' } },
    };

    const result = await protectedProcedure._def.middlewares[0]({
      ctx: mockContext,
      next: vi.fn().mockResolvedValue({ ok: true }),
    });

    expect(result.ok).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    const mockContext = { session: null };

    await expect(
      protectedProcedure._def.middlewares[0]({
        ctx: mockContext,
        next: vi.fn(),
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('Authorization Middleware', () => {
  it('should allow users with correct role', async () => {
    const adminProcedure = requireRole(['Admin']);

    const mockContext = {
      session: { user: { id: 'user-1', role: 'Admin', firmId: 'firm-1' } },
    };

    const result = await adminProcedure._def.middlewares[1]({
      ctx: mockContext,
      next: vi.fn().mockResolvedValue({ ok: true }),
    });

    expect(result.ok).toBe(true);
  });

  it('should reject users without correct role', async () => {
    const adminProcedure = requireRole(['Admin']);

    const mockContext = {
      session: { user: { id: 'user-1', role: 'Analyst', firmId: 'firm-1' } },
    };

    await expect(
      adminProcedure._def.middlewares[1]({
        ctx: mockContext,
        next: vi.fn(),
      })
    ).rejects.toThrow('FORBIDDEN');
  });
});
```

### Test Data Seeding Strategies

Create reusable test data factories:

```typescript
// tests/factories/deal.factory.ts
import { faker } from '@faker-js/faker';

export const createDealFactory = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  status: 'active',
  stage: 'sourcing',
  firmId: 'firm-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createManyDeals = (count: number) => {
  return Array.from({ length: count }, () => createDealFactory());
};

// Usage in tests
const testDeals = createManyDeals(50);
```

### CI/CD Testing Pipeline Integration

Ensure tests run in CI:

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on:
  pull_request:
    paths:
      - 'apps/api/**'
      - 'packages/**'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: trato_hive_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm --filter @trato-hive/db db:generate

      - name: Run migrations
        run: pnpm --filter @trato-hive/db db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/trato_hive_test

      - name: Run tests with coverage
        run: pnpm --filter api test --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/trato_hive_test
          REDIS_URL: redis://localhost:6379
          NEXTAUTH_SECRET: test-secret

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/coverage-final.json
```

## 11. Performance Requirements

- **API response time:** <500ms (p95)
- **Background jobs:** Use BullMQ for heavy operations (document processing, AI queries)
- **Database optimization:**
  - Use proper indexes (check Prisma schema)
  - Prevent N+1 queries (use `include` wisely)
  - Implement cursor-based pagination for large datasets
- **Caching:** Use Redis for frequently accessed data (via @trato-hive/data-plane)

## 10. Logging & Monitoring

### Fastify Built-in Logger (Pino)

```typescript
// index.ts
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Usage in services
fastify.log.info({ dealId }, 'Fetching deal');
fastify.log.error({ error }, 'Failed to create deal');
```

### tRPC Logging Middleware

```typescript
// middleware/logging.ts
export const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  console.log(`${type} ${path} - ${duration}ms`);

  return result;
});
```

## 11. 7-Layer Integration Examples

### Using @trato-hive/auth (Layer 6: Governance)

```typescript
import { auth } from '@trato-hive/auth';

const session = await auth(req, res);
```

### Using @trato-hive/ai-core (Layer 3: TIC Core)

```typescript
import { llm } from '@trato-hive/ai-core';

const response = await llm.query({
  prompt: 'Summarize this document',
  model: 'claude-sonnet-4.5',
});
```

### Using @trato-hive/agents (Layer 4: Agentic)

```typescript
import { documentAgent } from '@trato-hive/agents';

await documentAgent.ingestDocument({
  dealId,
  fileUrl,
});
```

### Using @trato-hive/data-plane (Layer 1: Data Plane)

```typescript
import { s3Client, jobQueue } from '@trato-hive/data-plane';

const uploadUrl = await s3Client.getUploadUrl(fileName);
await jobQueue.addJob('process-document', { docId });
```

### Using @trato-hive/semantic-layer (Layer 2: Semantic Layer)

```typescript
import { factStore, vectorSearch } from '@trato-hive/semantic-layer';

const facts = await factStore.getFactsByDeal(dealId);
const similar = await vectorSearch.findSimilar(query);
```

### Using BullMQ Job Queues (data-plane)

For long-running tasks, enqueue background jobs:

```typescript
import { jobQueue } from '@trato-hive/data-plane';

// routers/document.ts
export const documentRouter = router({
  process: requireFirm
    .input(z.object({
      documentId: z.string(),
      operations: z.array(z.enum(['ocr', 'fact_extraction', 'embedding'])),
    }))
    .mutation(async ({ input, ctx }) => {
      // Enqueue job instead of processing synchronously
      const job = await jobQueue.addJob('process-document', {
        documentId: input.documentId,
        operations: input.operations,
        firmId: ctx.firmId,
        userId: ctx.session.user.id,
      }, {
        priority: 1, // Higher priority for user-initiated jobs
        attempts: 3, // Retry 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      return {
        jobId: job.id,
        status: 'queued',
        estimatedTime: '2-5 minutes',
      };
    }),

  // Check job status
  jobStatus: requireFirm
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input, ctx }) => {
      const job = await jobQueue.getJob(input.jobId);

      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      return {
        id: job.id,
        status: job.status, // 'queued' | 'processing' | 'completed' | 'failed'
        progress: job.progress, // 0-100
        result: job.result,
        error: job.error,
      };
    }),
});
```

**Worker setup (separate process):**

```typescript
// workers/document-worker.ts
import { Worker } from 'bullmq';
import { processDocument } from '../services/document-service';

const worker = new Worker('process-document', async (job) => {
  const { documentId, operations } = job.data;

  // Update progress as we go
  await job.updateProgress(10);

  // Run OCR
  if (operations.includes('ocr')) {
    await runOCR(documentId);
    await job.updateProgress(40);
  }

  // Extract facts
  if (operations.includes('fact_extraction')) {
    await extractFacts(documentId);
    await job.updateProgress(70);
  }

  // Generate embeddings
  if (operations.includes('embedding')) {
    await generateEmbeddings(documentId);
    await job.updateProgress(100);
  }

  return { status: 'completed', documentId };
}, {
  connection: redisConnection,
  concurrency: 5, // Process 5 jobs concurrently
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```

### Vector Search Integration (semantic-layer)

Semantic search over documents and facts:

```typescript
import { vectorSearch } from '@trato-hive/semantic-layer';

// routers/search.ts
export const searchRouter = router({
  // Semantic search across all documents
  semantic: requireFirm
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(10),
      filters: z.object({
        dealId: z.string().optional(),
        documentTypes: z.array(z.string()).optional(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const results = await vectorSearch.search({
        query: input.query,
        limit: input.limit,
        filters: {
          firmId: ctx.firmId, // Enforce multi-tenancy
          ...input.filters,
        },
      });

      return {
        results: results.map((r) => ({
          documentId: r.documentId,
          excerpt: r.text,
          similarity: r.score,
          page: r.metadata.page,
        })),
      };
    }),

  // Find similar documents
  similar: requireFirm
    .input(z.object({
      documentId: z.string(),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input, ctx }) => {
      return await vectorSearch.findSimilar(input.documentId, input.limit, ctx.firmId);
    }),
});
```

### Audit Logging (auth package)

Log sensitive operations for compliance:

```typescript
import { auditLog } from '@trato-hive/auth';

// routers/deal.ts
export const dealRouter = router({
  delete: requireRole(['Admin', 'Manager'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Audit log BEFORE deleting
      await auditLog.create({
        action: 'deal.delete',
        userId: ctx.session.user.id,
        firmId: ctx.firmId,
        resourceType: 'deal',
        resourceId: input.id,
        metadata: {
          userRole: ctx.session.user.role,
          ip: ctx.req.ip,
          userAgent: ctx.req.headers['user-agent'],
        },
      });

      const result = await dealService.deleteDeal(input.id, ctx.firmId);

      return result;
    }),
});
```

**Audit log queries:**

```typescript
export const auditRouter = router({
  // Get audit trail for a resource
  getResourceAudit: requireRole(['Admin'])
    .input(z.object({
      resourceType: z.string(),
      resourceId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      return await auditLog.getByResource({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        firmId: ctx.firmId,
        limit: input.limit,
      });
    }),

  // Get user activity log
  getUserActivity: requireRole(['Admin', 'Manager'])
    .input(z.object({
      userId: z.string(),
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }))
    .query(async ({ input, ctx }) => {
      return await auditLog.getByUser({
        userId: input.userId,
        firmId: ctx.firmId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
    }),
});
```

### Multi-Step Agent Workflows (agents)

Orchestrate complex AI workflows:

```typescript
import { diligenceAgent } from '@trato-hive/agents';

// routers/diligence.ts
export const diligenceRouter = router({
  // Run full diligence workflow
  runDiligence: requireFirm
    .input(z.object({
      dealId: z.string(),
      documents: z.array(z.string()), // Document IDs
      questions: z.array(z.string()), // Diligence questions
    }))
    .mutation(async ({ input, ctx }) => {
      // Enqueue multi-step agent workflow
      const workflowId = await diligenceAgent.runWorkflow({
        dealId: input.dealId,
        documents: input.documents,
        questions: input.questions,
        firmId: ctx.firmId,
        userId: ctx.session.user.id,
        steps: [
          { name: 'extract_facts', timeout: 300 },
          { name: 'answer_questions', timeout: 600 },
          { name: 'generate_summary', timeout: 300 },
          { name: 'verify_citations', timeout: 180 },
        ],
      });

      return {
        workflowId,
        status: 'running',
        estimatedTime: '15-20 minutes',
      };
    }),

  // Get workflow status
  workflowStatus: requireFirm
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workflow = await diligenceAgent.getWorkflowStatus(input.workflowId, ctx.firmId);

      return {
        id: workflow.id,
        status: workflow.status,
        currentStep: workflow.currentStep,
        completedSteps: workflow.completedSteps,
        progress: workflow.progress,
        results: workflow.results,
        errors: workflow.errors,
      };
    }),
});
```

**Agent workflow benefits:**
- **Automatic retries** on transient failures
- **Progress tracking** for long-running operations
- **Step isolation** - failures don't affect completed steps
- **Auditable** - full execution log
- **Resumable** - can resume from last successful step

## 12. API Design Conventions

### Naming

- **Queries:** Use nouns (e.g., `deal.list`, `deal.get`, `deal.getFactSheet`)
- **Mutations:** Use verbs (e.g., `deal.create`, `deal.update`, `deal.delete`)

### Pagination

All list queries must support pagination:

```typescript
input: z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

output: z.object({
  items: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
})
```

### Filtering & Sorting

Optional but recommended for list queries:

```typescript
filter: z.object({
  status: z.enum(['active', 'closed']).optional(),
  stage: z.string().optional(),
}).optional(),

sort: z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']),
}).optional(),
```

## 13. Module-Specific Router Examples

Complete router implementations for all 5 Trato Hive modules.

### Module 1: Command Center Router

Dashboard statistics and KPIs:

```typescript
// routers/command-center.ts
import { z } from 'zod';
import { router, requireFirm } from '../utils/trpc';
import { commandCenterService } from '../services/command-center-service';

export const commandCenterRouter = router({
  // Get dashboard stats
  stats: requireFirm
    .query(async ({ ctx }) => {
      return await commandCenterService.getDashboardStats(ctx.firmId);
    }),

  // Get recent activity feed
  activity: requireFirm
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return await commandCenterService.getRecentActivity(ctx.firmId, input.limit);
    }),

  // Get KPIs for specific time period
  kpis: requireFirm
    .input(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      metrics: z.array(z.enum(['deal_count', 'pipeline_value', 'doc_processed'])),
    }))
    .query(async ({ input, ctx }) => {
      return await commandCenterService.getKPIs(ctx.firmId, input);
    }),
});
```

### Module 2: Discovery Router

AI-native company sourcing and enrichment:

```typescript
// routers/discovery.ts
import { z } from 'zod';
import { router, requireFirm } from '../utils/trpc';
import { discoveryService } from '../services/discovery-service';

export const discoveryRouter = router({
  // AI-powered company search
  search: requireFirm
    .input(z.object({
      query: z.string().min(1),
      filters: z.object({
        industry: z.array(z.string()).optional(),
        location: z.array(z.string()).optional(),
        revenue: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
        }).optional(),
        employees: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
        }).optional(),
      }).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return await discoveryService.searchCompanies(input, ctx.firmId);
    }),

  // Enrich company data using AI
  enrich: requireFirm
    .input(z.object({
      companyId: z.string(),
      sources: z.array(z.enum(['web', 'linkedin', 'crunchbase', 'pitchbook'])),
    }))
    .mutation(async ({ input, ctx }) => {
      return await discoveryService.enrichCompany(input.companyId, input.sources, ctx.firmId);
    }),

  // Get AI-generated company profile
  profile: requireFirm
    .input(z.object({
      companyId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await discoveryService.getCompanyProfile(input.companyId, ctx.firmId);
    }),

  // Add company to watchlist
  addToWatchlist: requireFirm
    .input(z.object({
      companyId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await discoveryService.addToWatchlist(input.companyId, ctx.firmId, ctx.session.user.id);
    }),
});
```

### Module 3: Deals Router

Interactive Pipeline OS:

```typescript
// routers/deal.ts
import { z } from 'zod';
import { router, requireFirm, requireRole } from '../utils/trpc';
import { dealService } from '../services/deal-service';

export const dealRouter = router({
  // List all deals with advanced filtering
  list: requireFirm
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      filter: z.object({
        status: z.enum(['active', 'closed', 'archived']).optional(),
        stage: z.array(z.string()).optional(),
        assignee: z.array(z.string()).optional(),
        createdAfter: z.string().datetime().optional(),
        createdBefore: z.string().datetime().optional(),
      }).optional(),
      sort: z.object({
        field: z.enum(['name', 'createdAt', 'updatedAt', 'value']),
        order: z.enum(['asc', 'desc']),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await dealService.listDeals(input, ctx.firmId);
    }),

  // Get single deal with full details
  get: requireFirm
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await dealService.getDeal(input.id, ctx.firmId);
    }),

  // Create new deal
  create: requireFirm
    .input(z.object({
      name: z.string().min(1),
      companyId: z.string(),
      stage: z.string(),
      value: z.number().optional(),
      assignees: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return await dealService.createDeal(input, ctx.firmId, ctx.session.user.id);
    }),

  // Update deal
  update: requireFirm
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        stage: z.string().optional(),
        value: z.number().optional(),
        status: z.enum(['active', 'closed', 'archived']).optional(),
        assignees: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      return await dealService.updateDeal(input.id, input.data, ctx.firmId);
    }),

  // Delete deal (Admin only)
  delete: requireRole(['Admin', 'Manager'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await dealService.deleteDeal(input.id, ctx.firmId);
    }),

  // Get AI-generated fact sheet for deal
  getFactSheet: requireFirm
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await dealService.getDealFactSheet(input.dealId, ctx.firmId);
    }),
});
```

### Module 4: Diligence Router

AI-native virtual data room:

```typescript
// routers/diligence.ts
import { z } from 'zod';
import { router, requireFirm } from '../utils/trpc';
import { diligenceService } from '../services/diligence-service';

export const diligenceRouter = router({
  // Upload document to VDR
  uploadDocument: requireFirm
    .input(z.object({
      dealId: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Returns pre-signed S3 upload URL
      return await diligenceService.initiateDocumentUpload(input, ctx.firmId);
    }),

  // Process document after upload
  processDocument: requireFirm
    .input(z.object({
      documentId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Enqueues background job for OCR + fact extraction
      return await diligenceService.processDocument(input.documentId, ctx.firmId);
    }),

  // Ask AI question about documents
  askQuestion: requireFirm
    .input(z.object({
      dealId: z.string(),
      question: z.string().min(1),
      documentIds: z.array(z.string()).optional(), // Scope to specific docs
    }))
    .mutation(async ({ input, ctx }) => {
      return await diligenceService.askQuestion(input, ctx.firmId, ctx.session.user.id);
    }),

  // Get all Q&A for a deal
  getQA: requireFirm
    .input(z.object({
      dealId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return await diligenceService.getQA(input.dealId, input.page, input.limit, ctx.firmId);
    }),

  // List documents in VDR
  listDocuments: requireFirm
    .input(z.object({
      dealId: z.string(),
      filter: z.object({
        category: z.array(z.string()).optional(),
        uploadedAfter: z.string().datetime().optional(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await diligenceService.listDocuments(input.dealId, input.filter, ctx.firmId);
    }),

  // Get document with extracted facts
  getDocument: requireFirm
    .input(z.object({
      documentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await diligenceService.getDocument(input.documentId, ctx.firmId);
    }),
});
```

### Module 5: Generator Router

Auditable material creation:

```typescript
// routers/generator.ts
import { z } from 'zod';
import { router, requireFirm } from '../utils/trpc';
import { generatorService } from '../services/generator-service';

export const generatorRouter = router({
  // Generate CIM (Confidential Information Memorandum)
  generateCIM: requireFirm
    .input(z.object({
      dealId: z.string(),
      template: z.enum(['default', 'tech', 'healthcare', 'financial']),
      sections: z.array(z.enum(['executive_summary', 'financials', 'operations', 'market'])),
    }))
    .mutation(async ({ input, ctx }) => {
      // Enqueues background job for AI generation
      return await generatorService.generateCIM(input, ctx.firmId, ctx.session.user.id);
    }),

  // Generate investment memo
  generateMemo: requireFirm
    .input(z.object({
      dealId: z.string(),
      template: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await generatorService.generateMemo(input.dealId, input.template, ctx.firmId);
    }),

  // Generate custom report
  generateReport: requireFirm
    .input(z.object({
      dealId: z.string(),
      reportType: z.string(),
      prompt: z.string(),
      includeDocuments: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return await generatorService.generateReport(input, ctx.firmId);
    }),

  // Get generation status
  getGenerationStatus: requireFirm
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await generatorService.getGenerationStatus(input.jobId, ctx.firmId);
    }),

  // List all generated materials for a deal
  listMaterials: requireFirm
    .input(z.object({
      dealId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await generatorService.listMaterials(input.dealId, ctx.firmId);
    }),

  // Verify citations in generated material
  verifyCitations: requireFirm
    .input(z.object({
      materialId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      return await generatorService.verifyCitations(input.materialId, ctx.firmId);
    }),
});
```

## 14. Security Checklist

- [ ] All procedures require authentication except health checks
- [ ] Authorization checks via tRPC middleware (role, firmId)
- [ ] Input validation with Zod schemas (built into tRPC)
- [ ] Rate limiting (@fastify/rate-limit)
- [ ] CORS whitelist (@fastify/cors)
- [ ] Security headers (@fastify/helmet)
- [ ] No secrets in code (use environment variables)
- [ ] Audit logging for sensitive operations

## 15. Deployment

### Production Build

```bash
# From project root
pnpm --filter api build

# This creates dist/index.js using tsup
```

### Docker Containerization

Create `apps/api/Dockerfile`:

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/*/
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @trato-hive/db db:generate
RUN pnpm --filter api build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
USER node

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t trato-hive-api -f apps/api/Dockerfile .
docker run -p 4000:4000 --env-file apps/api/.env.production trato-hive-api
```

### Environment Variable Management in Production

**Option 1: AWS Secrets Manager**

```typescript
// utils/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

export async function loadSecrets() {
  const command = new GetSecretValueCommand({
    SecretId: 'trato-hive/production',
  });

  const response = await client.send(command);
  const secrets = JSON.parse(response.SecretString!);

  // Override process.env with secrets
  Object.assign(process.env, secrets);
}

// Call before server starts
await loadSecrets();
```

**Option 2: HashiCorp Vault**

```typescript
import vault from 'node-vault';

const vaultClient = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

const secrets = await vaultClient.read('secret/trato-hive/production');
Object.assign(process.env, secrets.data);
```

### Graceful Shutdown

Ensure clean shutdown for zero-downtime deployments:

```typescript
// index.ts
const fastify = Fastify({
  logger: true,
});

// Register shutdown hooks
const signals = ['SIGINT', 'SIGTERM'];

signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server gracefully`);

    try {
      await fastify.close();
      fastify.log.info('Server closed successfully');
      process.exit(0);
    } catch (err) {
      fastify.log.error(err, 'Error during shutdown');
      process.exit(1);
    }
  });
});

await fastify.listen({ port: 4000, host: '0.0.0.0' });
```

### Monitoring & Observability

**Prometheus Metrics:**

```typescript
import fastifyMetrics from 'fastify-metrics';

await fastify.register(fastifyMetrics, {
  endpoint: '/metrics',
});

// Metrics available at http://localhost:4000/metrics
// - http_request_duration_seconds
// - http_request_total
// - process_cpu_usage
// - nodejs_heap_size_used_bytes
```

**Structured Logging (Pino):**

```typescript
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: req.headers,
          hostname: req.hostname,
          remoteAddress: req.ip,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  },
});

// Logs as JSON in production for easy parsing
```

**APM Integration (Datadog, New Relic, etc.):**

```typescript
import tracer from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  tracer.init({
    service: 'trato-hive-api',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  });
}
```

### Database Migration Strategy

**Option 1: Migrate on deploy (safer):**

```bash
# In deployment pipeline (before starting app)
pnpm --filter @trato-hive/db db:migrate:deploy

# Then start app
pnpm --filter api start
```

**Option 2: Automatic migration on startup (risky):**

```typescript
// index.ts
import { execSync } from 'child_process';

if (process.env.AUTO_MIGRATE === 'true') {
  fastify.log.info('Running database migrations...');
  execSync('pnpm --filter @trato-hive/db db:migrate:deploy', { stdio: 'inherit' });
}
```

**Recommended: Use migration scripts in CI/CD pipeline before deploying new code.**

### Deployment Checklist

- [ ] Environment variables configured (AWS Secrets Manager, Vault)
- [ ] Database migrations run (`db:migrate:deploy`)
- [ ] Prisma client generated (`db:generate`)
- [ ] Build artifacts created (`pnpm build`)
- [ ] Docker image built and tagged
- [ ] Health check endpoint responding (`/health`)
- [ ] Monitoring/APM configured (Datadog, New Relic)
- [ ] Logs shipping to centralized system (CloudWatch, Datadog)
- [ ] Graceful shutdown configured
- [ ] Rate limiting enabled
- [ ] CORS configured for production frontend URL
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules allow only necessary ports (443, 4000)

## 16. Troubleshooting

Common issues and solutions when developing or deploying the API.

### tRPC Errors

**Problem: "No 'Access-Control-Allow-Origin' header" (CORS error)**

```
Error: CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Solution:**

Check `FRONTEND_URL` environment variable matches your frontend URL:

```typescript
// index.ts
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

In development, ensure frontend is running on `http://localhost:3000`.

---

**Problem: "Input validation failed" (Zod error)**

```
TRPCError: [BAD_REQUEST] Input validation failed
```

**Solution:**

Check the Zod schema for the procedure. Use `.safeParse()` to debug:

```typescript
const input = { page: 'invalid' }; // Should be number
const result = listDealsSchema.safeParse(input);

if (!result.success) {
  console.log(result.error.issues); // See validation errors
}
```

Fix the client-side input to match the schema.

---

**Problem: "UNAUTHORIZED" even with valid session**

```
TRPCError: [UNAUTHORIZED] You must be logged in
```

**Solution:**

1. Verify NextAuth session is being passed to tRPC context:

```typescript
// utils/trpc.ts
export const createContext = async ({ req, res }) => {
  const session = await auth(req, res); // Check this returns session
  console.log('Session:', session); // Debug log

  return { session, prisma: db };
};
```

2. Check `NEXTAUTH_SECRET` matches between frontend and backend.

3. Verify cookies are being sent with credentials:

```typescript
// Frontend tRPC client
import { httpBatchLink } from '@trpc/client';

const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include', // Required for cookies
        });
      },
    }),
  ],
});
```

### Database Connection Issues

**Problem: "Can't reach database server" (Prisma error)**

```
PrismaClientInitializationError: Can't reach database server at localhost:5432
```

**Solution:**

1. Check Docker services are running:

```bash
docker-compose ps
# Should show postgres container running
```

2. Verify `DATABASE_URL` in `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trato_hive_dev"
```

3. Test connection directly:

```bash
psql -h localhost -U postgres -d trato_hive_dev
```

---

**Problem: "Prepared statement already exists"**

```
Error: Prepared statement "s1" already exists
```

**Solution:**

This happens with connection pooling. Use Prisma's built-in pooling:

```typescript
// Do NOT create multiple instances
// BAD
export const db1 = new PrismaClient();
export const db2 = new PrismaClient();

// GOOD - single instance
export const db = new PrismaClient();
```

### Redis Connection Issues

**Problem: "Redis connection refused"**

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**

1. Check Redis is running:

```bash
docker-compose ps redis
```

2. Test Redis connection:

```bash
redis-cli ping
# Should return "PONG"
```

3. Verify `REDIS_URL` in `.env`:

```bash
REDIS_URL="redis://localhost:6379"
```

### Authentication Debugging

**Problem: Session exists but `ctx.session.user` is undefined**

**Solution:**

Check middleware order. `protectedProcedure` must narrow the type:

```typescript
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user }, // Narrow type
    },
  });
});
```

### Performance Debugging

**Problem: Slow query response times**

**Solution:**

1. Enable Prisma query logging:

```typescript
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

2. Check for N+1 queries:

```typescript
// BAD - N+1 query
const deals = await db.deal.findMany();
for (const deal of deals) {
  const company = await db.company.findUnique({ where: { id: deal.companyId } });
}

// GOOD - single query with join
const deals = await db.deal.findMany({
  include: { company: true },
});
```

3. Add database indexes for frequently queried fields (check Prisma schema).

4. Use Redis caching for expensive queries:

```typescript
import { redis } from '@trato-hive/data-plane';

const cacheKey = `deals:${firmId}:list`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const deals = await db.deal.findMany({ where: { firmId } });
await redis.set(cacheKey, JSON.stringify(deals), 'EX', 300); // 5 min TTL

return deals;
```

---

**Problem: Memory leaks in long-running server**

**Solution:**

1. Monitor memory usage:

```bash
node --expose-gc dist/index.js
```

2. Use Node.js heap snapshots:

```typescript
import v8 from 'v8';
import fs from 'fs';

// Take heap snapshot
const snapshot = v8.writeHeapSnapshot();
console.log('Heap snapshot written to', snapshot);
```

3. Check for event listener leaks:

```typescript
// Monitor event listeners
process.on('warning', (warning) => {
  console.warn(warning.name, warning.message, warning.stack);
});
```

### Rate Limiting Debugging

**Problem: "Too Many Requests" (429) errors in development**

**Solution:**

Disable rate limiting in development:

```typescript
if (process.env.NODE_ENV !== 'production') {
  await fastify.register(rateLimit, {
    max: 10000, // Very high limit for dev
    timeWindow: '1 minute',
  });
}
```

Or exclude specific IPs:

```typescript
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1', 'localhost'], // No rate limit for localhost
});
```

## 17. Non-Negotiables

1. **No business logic in routers** - Always use services
2. **Always use protectedProcedure** for authenticated endpoints
3. **Always enforce multi-tenancy** via firmId checks
4. **Always validate inputs** with Zod schemas
5. **Always use TRPCError** for error responses
6. **Never expose internal errors** to client (sanitize error messages)
7. **Always write tests** for new procedures (>70% coverage)
