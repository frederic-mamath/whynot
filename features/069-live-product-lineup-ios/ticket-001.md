# Ticket 001 — DB + Backend: interest table, extended listByChannel, toggleInterest mutation

## Goal

Create the data foundation for buyer interest signals. No iOS changes in this ticket — backend only. The app must build at the end of this ticket.

## Acceptance Criteria

- As a buyer, when I call `product.toggleInterest`, my interest is stored if it didn't exist, or removed if it did
- As any user, when I call `product.listByChannel`, each product now includes `interestedCount` and `isInterestedByCurrentUser`
- Toggling is idempotent — calling toggle twice returns to the original state

## Technical Strategy

- DB Migration — `app/migrations/043_create_live_product_interests.ts`
  - Create table `live_product_interests`:
    ```ts
    id: Generated<number>
    buyer_id: integer NOT NULL REFERENCES users(id) ON DELETE CASCADE
    product_id: integer NOT NULL REFERENCES products(id) ON DELETE CASCADE
    live_id: integer NOT NULL REFERENCES lives(id) ON DELETE CASCADE
    created_at: timestamptz NOT NULL DEFAULT now()
    ```
  - Add unique constraint `live_product_interests_unique` on `(buyer_id, product_id, live_id)`
  - `down`: drop table

- Types — `app/src/db/types.ts`
  - Add `LiveProductInterestsTable` interface:
    ```ts
    export interface LiveProductInterestsTable {
      id: Generated<number>;
      buyer_id: number;
      product_id: number;
      live_id: number;
      created_at: Generated<Date>;
    }
    ```
  - Add `live_product_interests: LiveProductInterestsTable` to `Database`

- Repository (create) — `app/src/repositories/LiveProductInterestRepository.ts`
  - `toggle(buyerId: number, productId: number, liveId: number): Promise<{ isInterested: boolean; count: number }>`:
    - Check if row exists for `(buyer_id, product_id, live_id)`
    - If exists: delete it
    - If not: insert it
    - Then count remaining rows for `(product_id, live_id)` and return `{ isInterested, count }`
  - `countByProductAndLive(productId: number, liveId: number): Promise<number>`:
    - `SELECT COUNT(*) FROM live_product_interests WHERE product_id = ? AND live_id = ?`
  - `findInterestedProductIds(buyerId: number, liveId: number): Promise<number[]>`:
    - Returns product IDs the buyer is interested in for a given live

- Repository Index — `app/src/repositories/index.ts`
  - Export `liveProductInterestRepository` singleton

- Router — `app/src/routers/product.ts`
  - Modify `listByChannel`:
    - After fetching products, call `liveProductInterestRepository.findInterestedProductIds(ctx.user.id, input.channelId)` to get the set of product IDs the current user is interested in
    - For each product, call `liveProductInterestRepository.countByProductAndLive(product.id, input.channelId)`
    - Return shape: `{ ...mapProductToProductOutboundDto(p), interestedCount: number, isInterestedByCurrentUser: boolean }`
    - Note: batch the count queries with `Promise.all` to avoid N+1
  - Add new mutation `toggleInterest`:
    ```ts
    toggleInterest: protectedProcedure
      .input(z.object({ productId: z.number(), liveId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return liveProductInterestRepository.toggle(ctx.user.id, input.productId, input.liveId);
      })
    ```
  - Import `liveProductInterestRepository` from `"../repositories"`

## Verification

```bash
cd app && npm run build:client   # zero TypeScript errors
```

Manual: call `product.toggleInterest` twice for the same `(productId, liveId)` — confirm interest goes true → false. Call `product.listByChannel` — confirm each product has `interestedCount` and `isInterestedByCurrentUser`.

## Manual operations to configure services

Run migration after deploying:
```bash
cd app && npm run migrate
```
