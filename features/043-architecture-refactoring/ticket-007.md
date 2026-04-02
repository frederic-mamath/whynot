# Ticket 007 — Backend: Stripe webhook idempotency

## Acceptance Criteria

- As a developer, if Stripe delivers the same `payment_intent.succeeded` event twice (at-least-once delivery guarantee), the second delivery should be a no-op — the order should not be processed again
- As a developer, the `payment_intent.payment_failed` webhook should similarly not re-process already-failed orders

## Technical Strategy

- Backend
  - Server
    - `app/src/index.ts` *(modified)*
      - In the `payment_intent.succeeded` Stripe webhook handler: add `.where("payment_status", "=", "pending")` to the `updateTable("orders")` query
      - Since `.executeTakeFirst()` returns `undefined` when no rows match (order already paid), the package creation block is skipped automatically — no duplicate package assignment

## Why this works

Kysely's `updateTable().where(...).executeTakeFirst()` returns `undefined` if zero rows were updated. The existing `if (updatedOrder)` guard already prevents re-running the package creation logic. Adding the `payment_status = 'pending'` condition means a duplicate event touches nothing in the DB.
