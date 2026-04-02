# Ticket 001 — Backend: fix repository violations, auth, fee duplication

## Acceptance Criteria

- As a developer, routers `payout.ts` and `order.ts` should not query the DB directly — all DB access goes through repositories
- As a developer, `calculatePlatformFee` and `calculateSellerPayout` should exist in one place only (`src/utils/fees.ts`)
- As a developer, `auth.me` should use `protectedProcedure` instead of manually checking `ctx.userId`
- As a developer, `message.subscribe` should require authentication (`protectedProcedure`)
- As a developer, the server should fail to start if `JWT_SECRET` is not set (no silent default)
- As a developer, the `isChannelHost` function should be named `isLiveHost` to match the channels→lives rename

## Technical Strategy

- Backend
  - Utils
    - `app/src/utils/fees.ts` *(new)*
      - `calculatePlatformFee(finalPrice)`: single source of truth for platform fee (7%)
      - `calculateSellerPayout(finalPrice)`: single source of truth for seller payout (93%)
  - Repository
    - `app/src/repositories/PayoutRequestRepository.ts` *(modified)*
      - Added `export const payoutRequestRepository = new PayoutRequestRepository()` singleton
    - `app/src/repositories/index.ts` *(modified)*
      - Export `payoutRequestRepository` from `PayoutRequestRepository`
  - Router
    - `app/src/routers/payout.ts` *(modified)*
      - Import `orderRepository`, `payoutRequestRepository`, `userRoleRepository` from `../repositories` instead of using `db` directly
      - Replace all 3 raw admin DB queries with `userRoleRepository.hasActiveRole(userId, 'admin')`
      - Replace raw `db.selectFrom('orders')` with `orderRepository.findById(orderId)`
    - `app/src/routers/order.ts` *(modified)*
      - Replace `new OrderRepository()` with `orderRepository` singleton from repositories index
      - Replace raw `db.selectFrom('orders')` + `db.updateTable('orders')` with `orderRepository.findById` + `orderRepository.updateStripePaymentIntent`
      - Replace `order: any` map types with inferred types from repository return values
      - Fix `buyer_username` → `buyer_name` to match `PendingDeliveryOrder` interface
    - `app/src/routers/auction.ts` *(modified)*
      - Import `calculatePlatformFee`, `calculateSellerPayout` from `../utils/fees`
      - Remove local duplicate fee functions
      - Rename `isChannelHost` → `isLiveHost` (and all call sites)
    - `app/src/routers/auth.ts` *(modified)*
      - Change `me: publicProcedure` → `me: protectedProcedure` (auth guard handled by middleware)
    - `app/src/routers/message.ts` *(modified)*
      - Change `subscribe: publicProcedure` → `subscribe: protectedProcedure`
  - Service
    - `app/src/services/auctionService.ts` *(modified)*
      - Import `calculatePlatformFee`, `calculateSellerPayout` from `../utils/fees`
      - Remove local duplicate fee functions and unused `isChannelHost`
  - Configuration
    - `app/src/utils/auth.ts` *(modified)*
      - Throw `Error("JWT_SECRET environment variable is required")` if `process.env.JWT_SECRET` is not set
