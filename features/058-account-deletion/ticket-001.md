# ticket-001 — Backend: `auth.deleteAccount` mutation

## Acceptance Criteria

- As a buyer, when I call `auth.deleteAccount`, my user record is permanently deleted from the database
- As a buyer, after deletion, attempting to log in with my previous email returns an error (account not found)
- As a buyer, after deletion, my Stripe customer record is deleted if one existed
- As a buyer, after deletion, my OAuth provider links (Google, Apple) are removed
- As a developer, if the user has no Stripe customer ID, the mutation still succeeds without error

## Technical Strategy

### Backend
- **Router** — `app/src/routers/auth.ts`
  - Add `deleteAccount` as a `protectedProcedure` mutation (no input required — deletes the caller's own account)
  - Order of operations:
    1. Load user via `ctx.userId` to get `stripe_customer_id`
    2. If `stripe_customer_id` exists, call `StripeService.deleteCustomer()`
    3. Delete auth providers via `AuthProviderRepository.deleteAllByUserId()`
    4. Hard-delete user via `UserRepository.deleteById(ctx.userId)`
    5. Destroy the Express session (`ctx.req.session.destroy()`)
    6. Return `{ success: true }`
  - ⚠️ Before merging: run the deletion manually in dev and verify no FK constraint errors. If constraints exist on orders, bids, or auctions, either add `ON DELETE CASCADE` in a migration or nullify FKs before deletion.

- **Service** — `app/src/services/StripeService.ts`
  - Add `async deleteCustomer(customerId: string): Promise<void>`
    - Calls `this.stripe.customers.del(customerId)`
    - Catches and ignores `resource_missing` errors (customer already deleted in Stripe)

- **Repository** — `app/src/repositories/AuthProviderRepository.ts`
  - Add `async deleteAllByUserId(userId: number): Promise<void>`
    - `DELETE FROM auth_providers WHERE user_id = userId`

- **Repository** — `app/src/repositories/UserRepository.ts`
  - `deleteById(id)` already exists — no change needed

## Manual Operations

None — purely backend code.
