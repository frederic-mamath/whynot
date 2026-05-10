# ticket-004 — Backend: `auth.deletionBlockers` query + guard in `deleteAccount`

## Acceptance Criteria

- As a buyer, when I request account deletion and I have unpaid orders, the API returns a list of blocking product names with reason `payment_pending`
- As a buyer, when I request account deletion and I have packages not yet shipped or delivered, the API returns a list of blocking product names with reason `delivery_pending`
- As a seller, when I request account deletion and I have paid orders whose package is not yet shipped or delivered, the API returns a list of blocking product names with reason `shipment_pending`
- As any user, when I call `auth.deleteAccount` while blockers exist, the mutation throws `PRECONDITION_FAILED` (server-side defence in depth)
- Blocking product names are sorted alphabetically ascending

## Technical Strategy

- Backend
  - Repository
    - `app/src/repositories/OrderRepository.ts`
      - `findUnpaidByBuyer(buyerId: number)`: SELECT orders JOIN products WHERE buyer_id = buyerId AND payment_status NOT IN ('paid', 'refunded') — returns `{ productName: string }[]`
      - `findPaidUnshippedBySeller(sellerId: number)`: SELECT orders JOIN products LEFT JOIN packages WHERE seller_id = sellerId AND payment_status = 'paid' AND (package_id IS NULL OR packages.status NOT IN ('shipped', 'delivered')) — returns `{ productName: string }[]`
    - `app/src/repositories/PackageRepository.ts`
      - `findActiveByBuyer(buyerId: number)`: SELECT packages JOIN orders JOIN products WHERE buyer_id = buyerId AND packages.status NOT IN ('shipped', 'delivered') — returns `{ productName: string }[]`
  - Router
    - `app/src/routers/auth.ts`
      - `deletionBlockers` (`protectedProcedure.query`): calls the three new repository methods for `ctx.user.id`, merges results, deduplicates by productName+reason, sorts A→Z, returns `{ eligible: boolean; blockers: { productName: string; reason: "payment_pending" | "delivery_pending" | "shipment_pending" }[] }`
      - `deleteAccount` (existing mutation): add a blockers check at the top using the same logic — throw `TRPCError({ code: "PRECONDITION_FAILED", message: "pending_orders" })` if any blockers exist

### Manual operations to configure services

None.
