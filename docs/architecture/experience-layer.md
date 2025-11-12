# Experience Layer (Layer 5)

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Frontend & API Team
**Priority:** Medium

The **Experience Layer** presents Trato Hive to users and orchestrates interactions between the UI and backend services. It spans the web application (Next.js) and API controllers that delegate to agents and cores. This document describes the architecture, design system integration, and patterns used in this layer.

## 1. Responsibilities

1. **User Interface:** Implement responsive, accessible interfaces using Next.js 14 with the App Router and React server components. Render pages for Command Center, Discovery, Deals, Diligence, Generator and Settings.
2. **API Routes:** Define server actions and API routes in `apps/api/` that act as controllers. Validate requests, enforce authentication/authorization and call services/agents. Avoid embedding business logic in the controllers.
3. **State Management:** Manage client‑side state with React hooks and server state with caching strategies (e.g., React Query or SWR). Persist minimal data on the client; fetch data on demand from the API to ensure freshness and security.
4. **Form Validation:** Use Zod schemas to validate form inputs on both the client and server. Provide meaningful error messages and highlight invalid fields.
5. **Design System Integration:** Implement UIs according to The Intelligent Hive design system【861078381458516†L172-L213】. Use the provided components from `packages/ui/` (Buttons, Inputs, Cards, Modals, Tables) and adhere to color palette, typography and spacing.
6. **Error Handling & Feedback:** Provide immediate feedback for loading, success and error states. Use skeleton loaders, toast notifications and inline validations. Ensure that errors from backend services propagate to the UI gracefully.

## 2. Frontend Architecture

- **Next.js 14 App Router:** Use file‑based routing with Server and Client components. Pages that require data fetching (e.g., Deal 360° view) are implemented as server components, while interactive elements (e.g., Kanban drag‑and‑drop) are client components.
- **Server Components:** Fetch data from internal APIs (via `getServerSideProps` or server actions) and render HTML on the server. This reduces client bundle sizes and improves performance.
- **Client Components:** Handle interactions such as drag‑and‑drop in the pipeline, adjusting similarity sliders in lookalike discovery and controlling modals. These components import hooks from `packages/ui/` and manage local state.
- **Layout:** Implement a top‑level `Layout` component that includes navigation (left sidebar, top bar), global modals and theme context. Use dynamic imports for heavy components to improve initial load times.

## 3. Backend Architecture (API Routes)

- **Express Controllers:** In `apps/api/`, define route handlers that perform request validation (Zod), authentication (JWT), authorization (RBAC) and call services/agents. For example, `POST /api/v1/deals` invokes the Deals service to create a deal.
- **Services:** Business logic resides in service classes that orchestrate calls to the Data Plane, Semantic Layer, TIC Core and agents. Services return plain objects; they do not know about HTTP contexts.
- **Middleware:** Use middleware for common concerns (error handling, logging, rate limiting). Implement firmId filtering at this layer to enforce row‑level security.

## 4. Intelligent Hive Design System

- **Colors:** Adhere to the palette – Soft Sand backgrounds, Gold/Honey accents for CTAs and highlights, Charcoal Black for primary text and Teal Blue for AI‑generated content and citations.
- **Typography:** Use Lora for headings and Inter for body text. Ensure type scale follows the design guidelines.
- **Components:** Use `packages/ui/Button` for primary and secondary actions, `packages/ui/Card` for data display, `packages/ui/Modal` for overlays (e.g., citation modal), `packages/ui/Table` for listing items. Avoid custom styling unless extending the design system.
- **Spacing & Radius:** Use an 8 px base grid for spacing and at least 8 px border radius on all components. Ensure adequate contrast and accessible color combinations.

## 5. State Management Patterns

- **Server Data:** Fetch using server components and API calls; revalidate on each request or use caching with `revalidate` options. For interactive elements, re‑fetch on user actions.
- **Client State:** For transient UI state (e.g., selected companies, expanded cards), use React local state or context providers. Use global state sparingly; avoid Redux unless necessary.
- **Forms:** Use `react-hook-form` with Zod schema integration for efficient form handling and validation.

## 6. Form Validation with Zod

Define schemas in shared modules (e.g., `packages/validators/`) and import them into both client and server code. Example:

```typescript
import { z } from 'zod'

export const createDealSchema = z.object({
  name: z.string().min(1).max(128),
  stage: z.enum(['sourcing', 'screening', 'diligence', 'ic_prep', 'closing', 'portfolio']),
  firmId: z.string(),
  description: z.string().max(1024).optional()
})

export type CreateDealInput = z.infer<typeof createDealSchema>
```

On the client, pass the schema to `zodResolver` in `react-hook-form`. On the server, validate `req.body` before processing the request.

## 7. Error Handling & Feedback

- **Loading States:** Use skeleton components for lists and cards while data is fetched. Show spinners for long‑running tasks (e.g., generating an IC deck) and display progress indicators.
- **Success Messages:** Use toast notifications or inline banners when actions succeed (e.g., “Deal created successfully”). Provide links to view the new resource.
- **Error Messages:** Display descriptive error messages from the server. For validation errors, highlight the specific fields. For unexpected errors, show a generic message and log details in the console.

## 8. Conclusion

The Experience Layer ties together the technical capabilities of Trato Hive into a cohesive, user‑friendly application. By leveraging modern React patterns, server‑side rendering and a robust design system, we deliver fast, accessible and delightful interfaces without embedding business logic in the UI. This separation allows backend services and agents to evolve independently and ensures the system remains maintainable and cost‑effective.
