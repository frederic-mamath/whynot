# CLAUDE.md — app/src/

## tRPC + Repository Pattern

The mandatory data-access chain is: **Router → Repository → DB**

```
src/routers/shop.ts         # tRPC procedure — delegates to repository
src/repositories/ShopRepository.ts  # All Kysely queries for this domain
src/db/types.ts             # Kysely table type definitions
```

**Rules:**
- Routers **must never** import `db` or call Kysely directly — all DB access goes through a repository
- Repositories are instantiated as singletons and exported from `src/repositories/index.ts`
- Business logic lives in `src/services/` when it spans multiple repositories

## `protectedProcedure` vs `publicProcedure`

Use `protectedProcedure` (from `src/trpc.ts`) for any endpoint that requires an authenticated user. It provides `ctx.user.id` and throws `UNAUTHORIZED` automatically.

```typescript
import { router, protectedProcedure, publicProcedure } from "../trpc";

// Requires auth — ctx.user.id is available
me: protectedProcedure.query(async ({ ctx }) => { ... })

// Public — must manually check ctx.userId if needed
register: publicProcedure.mutation(async ({ input }) => { ... })
```

After Feature 043: `auth.me` and `message.subscribe` both use `protectedProcedure`.

## Kysely Type Conventions

- Table types are defined in `src/db/types.ts` using Kysely's `Selectable`, `Insertable`, `Updateable` helpers
- **Never use `any`** in repository method signatures — use `Updateable<TableType>` for update payloads
- Enum-like status columns must use typed union literals, not `string`:

```typescript
// ✅ Correct
status?: "pending" | "paid" | "failed" | "refunded"

// ❌ Wrong
status?: string
updateData: any
```

## Fee Calculations

Platform fee logic lives exclusively in `src/utils/fees.ts`:

```typescript
import { calculatePlatformFee, calculateSellerPayout } from "../utils/fees";
```

Do not duplicate fee calculations in routers or services. The rate constant is defined once in `fees.ts`.

## Environment Variables

`JWT_SECRET` **must** be set at startup — the app throws if it is missing. There is no fallback default. If you add new required env vars, follow the same pattern in `src/utils/auth.ts`: throw at module load time, not at request time.

## Stripe Webhooks

The webhook handler in `src/index.ts` is idempotent:
- `payment_intent.succeeded`: only updates orders with `payment_status = 'pending'` — duplicate delivery is a no-op
- `payment_intent.payment_failed`: likewise guards with a status check

Do not remove these guards when modifying the webhook handler.

## WebSocket Broadcasts

`src/websocket/broadcast.ts` uses an in-memory `Map`. This is intentional for the current single-instance deployment. Do not replace with Redis unless horizontal scaling is explicitly planned.
