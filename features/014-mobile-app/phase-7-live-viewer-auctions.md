# Phase 7: Live Viewer (Auctions)

## Objective

Add auction functionality to the live viewer: display active auctions, allow bidding, handle real-time auction events (bids, extensions, end), and show win/loss modals.

## User-Facing Changes

- Auction widget overlay (current price, countdown timer, top bidder)
- Bid input with validation (minimum = current price + increment)
- Real-time updates: new bids, time extensions, outbid notifications
- Auction end modal: won (with pay button) / lost
- Buy-out button when available

## Files to Update

### Frontend (mobile-app/)

- `src/components/live/AuctionWidget.tsx` — Auction display (price, timer, bidder)
- `src/components/live/AuctionCountdown.tsx` — Animated countdown timer
- `src/components/live/BidInput.tsx` — Bid amount input + submit button
- `src/components/live/AuctionEndModal.tsx` — Win/loss modal
- `app/channel/[channelId].tsx` — Integrate auction overlay into viewer

## Steps

1. Create AuctionWidget displaying current auction state
2. Create AuctionCountdown with animated timer
3. Create BidInput with validation and submit via `auction.placeBid`
4. Listen to WebSocket events: `auction:started`, `auction:bid_placed`, `auction:extended`, `auction:ended`
5. Handle `auction:outbid` — alert the user
6. Handle `auction:won` — show modal with payment CTA
7. Create AuctionEndModal for won/lost results
8. Integrate auction overlay into the live viewer screen

## Acceptance Criteria

- [ ] Active auction displays with correct price and time
- [ ] Countdown timer updates in real-time
- [ ] Bid submission works with validation
- [ ] New bids from other users appear in real-time
- [ ] Outbid notification shown when surpassed
- [ ] Auction end modal appears with correct result
- [ ] Buy-out works when configured

## Status

📝 PLANNING
