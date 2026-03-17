# Ticket 1 — useAuction Hook + Host CTAs + AuctionCard

## Acceptance Criteria

- As a seller/host, in the live details page, when there is no highlighted product, I see "Choisir un produit à mettre en avant" which scrolls smoothly to the 2nd MobilePage on the "Boutique du live" tab
- As a seller/host, in the live details page, when there is a highlighted product and no active auction, I see "Commencer les enchères" which opens the AuctionConfigModal
- As a seller/host, in the live details page, when an auction is active and has a winner, I see "Vendre à <winner_nickname>" which closes/sells the auction
- As a seller/host, in the live details page, when an auction is active but has no bidder, I see "Annuler l'enchère" which cancels the auction
- As any user, below the highlighted product, an AuctionCard shows: winner's nickname (or "Aucun enchérisseur"), current price, and time remaining (MM:SS countdown)

## Technical Strategy

- Frontend
  - Hook
    - `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`
      - `useAuction(liveId)`: Polls `trpc.auction.getActive` every 3s; manages local countdown via `setInterval(1000)` from `endsAt`; exposes `startAuction`, `closeAuction`; manages `isAuctionModalOpen` state
  - Component
    - `app/client/src/pages/LiveDetailsPage/AuctionCard/AuctionCard.tsx`
      - New card component: props `winnerNickname`, `currentPrice`, `timeLeftSeconds`; displays Trophy icon + nickname, price in bold, Timer icon + MM:SS countdown
    - `app/client/src/pages/LiveDetailsPage/AuctionCard/index.ts`
      - Default export barrel
  - Page
    - `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`
      - Import and call `useAuction(liveId)`; replace host CTA div with conditional buttons; add `<AuctionCard>` below `<HighlightedProduct>`; add `<AuctionConfigModal>` before closing MobilePage

## Manual operations to configure services

- None
