# Shared Package (@trato-hive/shared)

## Purpose

Foundation package (Layer 0) for types, validators, constants, and utils.

## Tech Stack

- **Runtime:** Zod (Validation)
- **Build:** tsup (CJS + ESM)

## Contents

- **Validators:** Zod schemas (`createDealSchema`, `emailSchema`).
- **Types:** Inferred types + API interfaces (`ApiResponse`).
- **Constants:** Enums (`PipelineStage`, `FactType`).
- **Utils:** Formatting (`formatCurrency`), Validation (`isValidCUID`).

## Common Patterns

### Validator + Type

```typescript
export const createDealSchema = z.object({ ... });
export type CreateDealInput = z.infer<typeof createDealSchema>;
```

### Enum Constant

```typescript
export const PipelineStage = { SOURCING: 'SOURCING', ... } as const;
export type PipelineStage = typeof PipelineStage[keyof typeof PipelineStage];
```

## Non-Negotiables

- **Zero Deps:** No runtime dependencies except Zod.
- **Type Safety:** Export Schema AND Type.
- **Consistency:** Match Prisma enums exactly.
