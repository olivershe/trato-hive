# API Layer (Layer 7)

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Backend Platform Team
**Priority:** Medium

The **API Layer** defines the external interface of Trato Hive. It exposes RESTful endpoints that allow clients (web app, mobile, third‑party integrations) to interact with the system. The API Layer ensures uniform response formats, applies authentication and authorization middleware, and enforces rate limiting.

## 1. Responsibilities

1. **Endpoint Definition:** Define resources and actions (e.g., `/api/v1/deals`, `/api/v1/discovery/search`, `/api/v1/diligence/qa`). Use RESTful conventions: GET to retrieve, POST to create, PATCH to update and DELETE to remove.
2. **Request Validation:** Validate incoming parameters (path, query, body) using schemas (Zod). Reject malformed or unsupported requests with appropriate status codes (400 Bad Request).
3. **Authentication & Authorization:** Apply JWT validation middleware and enforce RBAC. Ensure that each request is associated with a firm and that row‑level security checks are performed.
4. **Uniform Response Format:** Return JSON objects with consistent keys:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "pagination": { "page": 1, "limit": 20, "total": 200 } }
}
```

On error, return:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": {...} }
}
```

5. **Pagination, Filtering & Sorting:** Provide `page`, `limit`, `sort` and `filter` query parameters. Use consistent defaults (page 1, limit 20) and enforce maximum page sizes. Document allowed filter fields for each resource.
6. **Rate Limiting:** Protect the API from abuse by limiting requests per minute per IP or user. Implement exponential backoff on repeated violations and return `429 Too Many Requests` when limits are exceeded.
7. **Webhook System:** Allow external systems to subscribe to events (e.g., “deal created”, “diligence question answered”). Provide endpoints to register webhooks and deliver signed payloads to subscriber URLs. Expose secret validation to ensure authenticity.
8. **Versioning:** Prefix routes with `/api/v1/`. Introduce `/api/v2/` for breaking changes when needed. Support multiple versions concurrently with explicit version negotiation.

## 2. Package Mapping

| Component | Description |
|-----------|-------------|
| **`apps/api/routes/`** | Contains route definitions (Express or Next.js API handlers). Each file corresponds to a resource (e.g., `deals.ts`). |
| **`packages/api-utils/`** (to be created) | Houses helper functions for response formatting, pagination utilities and rate limiting middleware. |
| **Middleware** | Authentication (`verifyJWT`), authorization (`checkPermissions`), logging (`logRequest`), input validation (`validateRequest`). |

## 3. Response Format Standards

Consistent response formatting helps clients handle results uniformly. Use the following structure:

- **`success` (boolean):** Indicates whether the request was successful.
- **`data` (object or array):** Contains the requested resource or result. Absent if `success` is false.
- **`meta` (object, optional):** Holds additional information such as pagination details (`page`, `limit`, `total`), sorting fields or warnings.
- **`error` (object):** Contains error code, human‑readable message and optional details. Present only when `success` is false.

Example success:

```json
{
  "success": true,
  "data": {
    "deal": { "id": "123", "name": "Alpha Acquisition" }
  },
  "meta": {}
}
```

Example error:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication token missing or invalid"
  }
}
```

## 4. Pagination, Filtering & Sorting Patterns

- **Pagination:** Accept `page` and `limit` query parameters. Default to page 1 and limit 20. Cap limit at 100. Return `meta.pagination` with `page`, `limit` and `total` counts.
- **Filtering:** Accept filter parameters via query (e.g., `?stage=sourcing&firmId=abc`). Validate allowed fields and operators. Complex filters (ranges, partial matches) should be passed in a `filter` object in the request body for POST endpoints.
- **Sorting:** Accept a `sort` parameter with the format `field:direction` (e.g., `createdAt:desc`). Validate allowed fields and default to ascending order.

## 5. Authentication & Authorization on Routes

All API routes must include middleware to:
1. Verify the presence and validity of a JWT. Decode claims and attach them to the request context.
2. Check that the user’s role has permission to perform the action (based on RBAC rules defined in the Governance Layer).
3. Enforce firmId matching on resource access (row‑level security).
4. Rate limit requests per user/IP using a token bucket algorithm.

## 6. Rate Limiting Strategies

Implement rate limiting at the API gateway or middleware level. Use a token bucket algorithm with configurable limits (e.g., 60 requests per minute per user). Provide `Retry‑After` headers in responses when limits are exceeded. Consider separate limits for expensive operations (e.g., generating an IC deck) vs. simple reads.

## 7. Webhook System Design

Provide endpoints to register, update and delete webhooks:
- **Register:** `POST /api/v1/webhooks` with fields `{ url, events: string[] }`. Return a secret used to sign payloads.
- **Delivery:** When an event occurs, send a POST request to the subscriber’s URL with the event payload and an `X‑Signature` header containing the HMAC signature. Retries are attempted on failure.
- **Security:** Validate that subscriber URLs use HTTPS and belong to allowed domains. Provide a mechanism to rotate secrets and pause webhooks.

## 8. API Versioning

- **Version Prefixes:** Begin all routes with `/api/v1/`. When breaking changes are introduced, expose a new version (`/api/v2/`) while maintaining the previous version for backward compatibility.
- **Deprecation Policy:** Announce deprecation at least one release ahead. Provide a migration guide and deprecate old versions only after clients have transitioned.

## 9. Conclusion

The API Layer acts as the public face of the Trato Hive architecture. By adhering to RESTful conventions, enforcing consistent response formats and implementing robust security and rate limiting, we provide a stable and predictable interface for clients and integration partners. Like the other layers, the API Layer should remain thin and delegate business logic to services and agents in the lower layers, ensuring maintainability and flexibility.
