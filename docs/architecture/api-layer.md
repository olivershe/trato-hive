# API Layer (Layer 7)

**Status:** Updated for tRPC
**Last Updated:** 2025-11-13
**Owner:** Backend Platform Team
**Priority:** High

The **API Layer** defines the external interface of Trato Hive. It exposes type-safe tRPC procedures that allow clients (web app, mobile, third-party integrations) to interact with the system. The API Layer ensures end-to-end type safety, applies authentication and authorization middleware, and enforces rate limiting.

## 1. Responsibilities

1. **Procedure Definition:** Define routers and procedures (e.g., `deal.list`, `deal.create`, `discovery.search`, `diligence.qa`). Use tRPC conventions: `.query()` for reads, `.mutation()` for writes.
2. **Request Validation:** Validate incoming parameters using Zod schemas (integrated into tRPC). Reject malformed or unsupported requests with tRPC error codes (`BAD_REQUEST`).
3. **Authentication & Authorization:** Apply NextAuth session validation middleware and enforce RBAC. Ensure that each request is associated with a firm and that row-level security checks are performed.
4. **Type-Safe Responses:** Return strongly-typed data with automatic client-side type inference. No manual type definitions required.
5. **Pagination, Filtering & Sorting:** Provide input schemas with `{ page, limit, filter?, sort? }`. Use consistent defaults (page 1, limit 20) and enforce maximum page sizes. Document allowed filter fields for each procedure.
6. **Rate Limiting:** Protect the API from abuse using Fastify rate-limit plugin. Implement exponential backoff on repeated violations and return `429 Too Many Requests` when limits are exceeded.
7. **Webhook System:** Allow external systems to subscribe to events (e.g., "deal created", "diligence question answered"). Provide procedures to register webhooks and deliver signed payloads to subscriber URLs.
8. **Versioning:** Use router namespacing for versioning (e.g., `v1.deal.list`). Introduce `v2` routers for breaking changes when needed. Support multiple versions concurrently with explicit version negotiation.

## 2. Package Mapping

| Component | Description |
|-----------|-------------|
| **`apps/api/src/routers/`** | Contains tRPC router definitions. Each file corresponds to a domain (e.g., `deal.ts`, `discovery.ts`). |
| **`apps/api/src/procedures/`** | Individual tRPC procedures (`.query()` and `.mutation()`). |
| **`apps/api/src/middleware/`** | tRPC middleware for authentication (`protectedProcedure`), authorization (`requireRole`, `requireFirm`), logging. |
| **`apps/api/src/services/`** | Business logic layer that procedures delegate to. |
| **`packages/auth/`** | Provides tRPC context, middleware, and RBAC utilities. |

## 3. tRPC Architecture

### Request Flow

```
Client Request (trpc.deal.list.useQuery({ page: 1 }))
    ↓
Fastify HTTP Server
    ↓
tRPC Fastify Adapter
    ↓
tRPC Router (dealRouter)
    ↓
tRPC Procedure (deal.list)
    ↓
tRPC Middleware (protectedProcedure, requireFirm)
    ↓
Service Layer (dealService.listDeals())
    ↓
Package Layer (@trato-hive/*)
    ↓
Database/External APIs
```

### Type Safety

tRPC provides end-to-end type safety from client to server:

**Server-side procedure:**
```typescript
export const dealRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      filter: z.object({
        status: z.enum(['active', 'closed']).optional(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return await dealService.listDeals(input, ctx.session);
    }),
});
```

**Client-side usage:**
```typescript
const { data, isLoading } = trpc.deal.list.useQuery({
  page: 1,
  limit: 20,
  filter: { status: 'active' },
});
// TypeScript knows the exact shape of `data` - no manual type definitions!
```

## 4. Response Format Standards

Unlike REST APIs, tRPC procedures return plain data objects with automatic type inference. No need for wrapper objects like `{ success: true, data: {...} }`.

**Success response:**
```typescript
// Procedure returns plain object
return {
  deals: [...],
  pagination: { page: 1, limit: 20, total: 100 },
};

// Client receives typed object
const { data } = trpc.deal.list.useQuery({ page: 1 });
console.log(data.deals); // TypeScript knows this is Deal[]
console.log(data.pagination.total); // TypeScript knows this is number
```

**Error response:**
```typescript
// Throw TRPCError with error code
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'You must be logged in to access this resource',
});

// Client catches typed error
const { error } = trpc.deal.list.useQuery({ page: 1 });
if (error) {
  console.log(error.data?.code); // 'UNAUTHORIZED'
  console.log(error.message); // 'You must be logged in...'
}
```

**tRPC Error Codes:**
- `UNAUTHORIZED` - No valid session
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input (Zod validation failed)
- `INTERNAL_SERVER_ERROR` - Unexpected error
- `TOO_MANY_REQUESTS` - Rate limit exceeded

## 5. Pagination, Filtering & Sorting Patterns

### Standard Input Schema

All list procedures should follow this pattern:

```typescript
.input(z.object({
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),

  // Filtering (optional, domain-specific)
  filter: z.object({
    status: z.enum(['active', 'closed']).optional(),
    stage: z.string().optional(),
    createdAfter: z.string().datetime().optional(),
  }).optional(),

  // Sorting (optional)
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
}))
```

### Standard Output Schema

```typescript
return {
  items: [...],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number,
  },
};
```

### Example Usage

```typescript
// Client
const { data } = trpc.deal.list.useQuery({
  page: 2,
  limit: 50,
  filter: {
    status: 'active',
    stage: 'sourcing',
  },
  sort: {
    field: 'createdAt',
    order: 'desc',
  },
});

// TypeScript automatically validates and infers types
console.log(data.items); // Deal[]
console.log(data.pagination.total); // number
```

## 6. Authentication & Authorization

### NextAuth Session in tRPC Context

```typescript
// apps/api/src/utils/trpc.ts
import { auth } from '@trato-hive/auth';

export const createContext = async ({ req, res }) => {
  const session = await auth(req, res);

  return {
    session,
    db,
  };
};
```

### Protected Procedures

```typescript
// From @trato-hive/auth
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
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
// Example: Only Admins and Managers can delete deals
export const dealRouter = router({
  delete: requireRole(['Admin', 'Manager'])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await dealService.deleteDeal(input.id, ctx.session);
    }),
});
```

### Multi-Tenancy Enforcement

All protected procedures automatically enforce firmId via `requireFirm` middleware:

```typescript
export const dealRouter = router({
  list: requireFirm
    .input(listDealsSchema)
    .query(async ({ input, ctx }) => {
      // ctx.firmId is guaranteed to exist
      // Service layer filters by ctx.firmId
      return await dealService.listDeals(input, ctx.firmId);
    }),
});
```

## 7. Rate Limiting Strategies

Implement rate limiting using Fastify's `@fastify/rate-limit` plugin:

```typescript
// apps/api/src/index.ts
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 100, // 100 requests
  timeWindow: '1 minute', // per minute
  cache: 10000, // cache size
  allowList: ['/health'], // excluded routes
  redis: redisClient, // use Redis for distributed rate limiting
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || req.ip;
  },
  errorResponseBuilder: (req, context) => {
    return {
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Retry after ${context.after}`,
    };
  },
});
```

**Tiered Rate Limits:**
- Public procedures: 60 requests/minute
- Authenticated procedures: 120 requests/minute
- Admin procedures: 300 requests/minute
- Expensive operations (AI queries): 10 requests/minute

## 8. Webhook System Design

Provide tRPC procedures to manage webhooks:

### Register Webhook

```typescript
export const webhookRouter = router({
  register: protectedProcedure
    .input(z.object({
      url: z.string().url().startsWith('https://'),
      events: z.array(z.enum(['deal.created', 'deal.updated', 'diligence.qa.answered'])),
    }))
    .mutation(async ({ input, ctx }) => {
      const secret = generateWebhookSecret();

      const webhook = await db.webhook.create({
        data: {
          firmId: ctx.firmId,
          url: input.url,
          events: input.events,
          secret,
        },
      });

      return {
        id: webhook.id,
        secret, // Return once, then store securely
      };
    }),
});
```

### Webhook Delivery

When events occur, deliver signed payloads:

```typescript
import crypto from 'crypto';

export async function deliverWebhook(webhookId: string, payload: any) {
  const webhook = await db.webhook.findUnique({ where: { id: webhookId } });

  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Event-Type': payload.event,
    },
    body: JSON.stringify(payload),
  });
}
```

### Webhook Security

- All webhook URLs must use HTTPS
- Payloads signed with HMAC-SHA256
- Secrets rotatable via `webhook.rotateSecret` procedure
- Webhooks pausable via `webhook.pause` procedure
- Failed deliveries retried with exponential backoff (3 attempts)

## 9. API Versioning

### Router Namespacing

Use nested routers for versioning:

```typescript
export const appRouter = router({
  v1: router({
    deal: dealRouter,
    discovery: discoveryRouter,
    diligence: diligenceRouter,
  }),
  v2: router({
    deal: dealRouterV2, // Breaking changes
  }),
});

// Client usage
trpc.v1.deal.list.useQuery({ page: 1 }); // Old version
trpc.v2.deal.list.useQuery({ page: 1 }); // New version
```

### Deprecation Policy

1. Announce deprecation in release notes at least 3 months ahead
2. Add deprecation warnings to procedure responses
3. Provide migration guide in documentation
4. Support old version for 6 months after deprecation
5. Remove old version only after monitoring shows <1% usage

### Breaking Change Examples

- Changing input/output schema structure
- Renaming procedures or routers
- Removing required fields
- Changing validation rules

### Non-Breaking Change Examples

- Adding optional fields to input/output
- Adding new procedures
- Adding new error codes
- Performance improvements

## 10. Error Handling Best Practices

### Service Layer Errors

```typescript
// services/deal-service.ts
import { TRPCError } from '@trpc/server';

export class DealService {
  async getDeal(id: string, session: Session) {
    const deal = await db.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Deal with ID ${id} not found`,
      });
    }

    if (deal.firmId !== session.user.firmId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this deal',
      });
    }

    return deal;
  }
}
```

### Client-Side Error Handling

```typescript
const { data, error, isLoading } = trpc.deal.get.useQuery({ id: 'deal-123' });

if (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else if (error.data?.code === 'NOT_FOUND') {
    // Show 404 page
  } else {
    // Show generic error message
    console.error(error.message);
  }
}
```

## 11. Performance Considerations

### Background Jobs for Heavy Operations

For expensive operations (document processing, AI queries), enqueue background jobs:

```typescript
export const documentRouter = router({
  process: protectedProcedure
    .input(z.object({ dealId: string(), fileUrl: string() }))
    .mutation(async ({ input, ctx }) => {
      // Enqueue job, don't process synchronously
      const job = await jobQueue.addJob('process-document', {
        dealId: input.dealId,
        fileUrl: input.fileUrl,
        userId: ctx.session.user.id,
      });

      return {
        jobId: job.id,
        status: 'queued',
      };
    }),

  status: protectedProcedure
    .input(z.object({ jobId: string() }))
    .query(async ({ input }) => {
      const job = await jobQueue.getJob(input.jobId);
      return {
        status: job.status,
        progress: job.progress,
      };
    }),
});
```

### Database Optimization

- Use proper indexes on frequently queried fields
- Implement cursor-based pagination for large datasets
- Prevent N+1 queries with Prisma `include`
- Cache expensive queries in Redis (via @trato-hive/data-plane)

### Response Time Targets

- Simple queries (<5 DB operations): <200ms (p95)
- Complex queries (joins, aggregations): <500ms (p95)
- Mutations: <300ms (p95)
- Background job enqueue: <100ms (p95)

## 12. Monitoring & Logging

### tRPC Logging Middleware

```typescript
export const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  fastify.log.info({
    type,
    path,
    duration,
    success: result.ok,
  });

  return result;
});
```

### Metrics to Track

- Request rate per procedure
- Error rate per procedure
- Response time percentiles (p50, p95, p99)
- Rate limit violations per user
- Webhook delivery success rate

## 13. Conclusion

The tRPC API Layer provides a type-safe, modern alternative to traditional REST APIs. By leveraging TypeScript's type system, we eliminate entire classes of bugs and provide exceptional developer experience. The tight integration with NextAuth for authentication, Zod for validation, and Fastify for performance ensures that Trato Hive's API is secure, fast, and maintainable.

Like the other layers, the API Layer remains thin and delegates business logic to services and agents in the lower layers, ensuring separation of concerns and testability.
