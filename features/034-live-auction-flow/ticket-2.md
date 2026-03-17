# Ticket 2 — Buyer Bid & Buyout CTAs

## Acceptance Criteria

- As a buyer, in the live details page, "Acheter tout de suite", "+5€" and "+10€" are visually disabled (opacity-50, no-op onClick) when no auction is active
- As a buyer, when an auction is active, "+5€" calls `auction.placeBid` with `currentBid + 5`
- As a buyer, when an auction is active, "+10€" calls `auction.placeBid` with `currentBid + 10`
- As a buyer, when an auction is active and a buyout price is set, "Acheter tout de suite" calls `auction.buyout`
- As a buyer, "Acheter tout de suite" is disabled if no auction is active OR the auction has no buyout price

## Technical Strategy

- Frontend
  - Hook
    - `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`
      - `useAuction(liveId)`: Add `placeBid(amount)` and `buyout()` functions using `trpc.auction.placeBid.useMutation` and `trpc.auction.buyout.useMutation`; invalidate `auction.getActive` on success
  - Page
    - `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`
      - Buyer CTA div: pass `disabled` to ButtonV2 for "Acheter tout de suite"; add `cursor-not-allowed opacity-50` className and no-op onClick to IconButton when no auction; wire `onClick` to `placeBid` / `buyout`

## Manual operations to configure services

- None
