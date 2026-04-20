# Ticket 001 — Fix winner nickname + AuctionEndModal trigger

## Acceptance Criteria

- As a live viewer, when an auction ends, I should see the winner identified by their nickname (not firstname + lastname)
- As a live participant, when an auction ends, the AuctionEndModal should open automatically showing the winner's nickname, final price, and bid count
- As a seller / host, when an auction ends, the AuctionEndModal should open automatically
- As a live viewer who did not bid, when an auction ends, the AuctionEndModal should open showing who won
- The app must build with zero TypeScript errors

## Technical Strategy

### Backend

- `app/src/repositories/AuctionRepository.ts`
  - In the `findById` select, add `'bidder.nickname as bidder_nickname'` alongside the existing `bidder_firstname` / `bidder_lastname` columns (the `bidder` left-join alias is already in place)

- `app/src/mappers/auction.mapper.ts`
  - Add `bidder_nickname: string | null` to the function parameter type
  - Replace `bidderUsername = firstname + " " + lastname` with `bidderUsername = auction.bidder_nickname ?? null`

- `app/src/services/auctionService.ts`
  - In `closeAuction`, the winner query (around line 81) currently selects `firstname` and `lastname` to build `winnerUsername`. Add `nickname` to the select, and build `winnerUsername = winner.nickname ?? winner.firstname + " " + winner.lastname` as a fallback
  - This value is broadcast via `auction:ended` WebSocket event and used in `auction:won` — both will then carry the nickname

### Frontend

- `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`
  - **Root cause to investigate**: when the `auction:ended` WebSocket event fires, the `AuctionWidget`'s `auction.status` is not updating from `"active"` to `"ended"`, so `isEnded` stays `false` and the modal never opens.
  - **Fix**: in the `auction:ended` WebSocket message handler, call `utils.auction.getById.invalidate()` (or the equivalent query invalidation for the active auction) so React Query re-fetches the auction and the status reflects `"ended"`.
  - Check the existing handler — the event is already parsed in `ChatPanel.tsx:246` but the auction query cache may not be invalidated in `LiveDetailsPage.hooks.ts`.

- `app/client/src/components/ChatPanel/ChatPanel.tsx`
  - The `auction:ended` handler at line 247 already shows a chat message with `event.winnerUsername` — no change needed once the backend sends nickname

## Out of scope

- Particle animation (ticket-002)
- Any change to the modal's layout or copy
