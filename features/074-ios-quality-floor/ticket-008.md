# Ticket 008 — Shared LiveEvent discriminated union

## Goal

Both live screens cast `event` to ad-hoc shapes inside the tRPC subscription handler (`event as { type: string; product?: { id, name, price, imageUrl? }; ... }`). The two casts have already diverged. Backend renames silently break the iOS client with no TypeScript error.

Define a `LiveEvent` discriminated union on the server, export it through the tRPC subscription's return type, and consume it from both iOS screens via switch with an exhaustiveness check.

**This is the one ticket in feature 074 that touches `app/` (backend)** — explicitly authorized in PO scope confirmation.

## Acceptance Criteria

- As a developer, when I rename or remove a field on a server-side live event, `tsc` flags every iOS consumer
- As a developer, the `event` parameter in `trpc.live.subscribeToEvents.useSubscription({ onData })` is typed as `LiveEvent` without any `as` cast
- As a developer, the switch on `event.type` in both screens has an exhaustiveness check (`const _exhaustive: never = event` in `default:`)
- As a developer, `cd app && npm run build:client` passes
- As a developer, `cd ios-app && npx tsc --noEmit` passes

## Technical Strategy

- Backend / Types
  - `app/src/types/live-events.ts`
    - Export discriminated union covering every emission currently produced. Initial entries (verify against actual emissions before finalizing):
      - `{ type: "PRODUCT_HIGHLIGHTED"; product: { id, name, price, imageUrl?: string | null } }`
      - `{ type: "PRODUCT_UNHIGHLIGHTED" }`
      - `{ type: "auction:started"; auctionId; productName; startingPrice; endsAt }`
      - `{ type: "auction:bid"; auctionId; currentBid; highestBidderUsername?: string | null }`
      - `{ type: "auction:ended"; auctionId; winnerId?: number | null; winnerUsername?: string | null; finalPrice; hasWinner }`
      - `{ type: "auction:outbid"; auctionId; outbidUserId; productName; currentBid }`
      - `{ type: "participant_count_changed"; participantCount }`
    - Audit current emissions by searching `app/src/routers/live.ts`, `app/src/services/auctionProcessor.ts`, and `app/src/websocket/broadcast.ts` — confirm the union is exhaustive before deleting the inline casts
- Backend / Router
  - `app/src/routers/live.ts`
    - `subscribeToEvents` procedure: set output type to `LiveEvent` (via `tracked()` or `subscription<LiveEvent>` per the installed tRPC version). All `broadcast(channelId, event)` calls must satisfy `LiveEvent`.
- Frontend / Migration
  - `ios-app/app/live/[liveId].tsx`
    - Remove inline `event as { type: string; product?: ... }` cast
    - Replace with `switch (event.type) { case "PRODUCT_HIGHLIGHTED": ...; default: { const _: never = event; return; } }`
  - `ios-app/app/seller-live/[liveId].tsx`
    - Same — remove second inline cast, switch on `event.type` with exhaustiveness check

## Verification

```bash
cd app && npm run build:client
cd ../ios-app && npx tsc --noEmit
```

Both pass. Rename one field on the backend (e.g. `currentBid` → `bidAmount`) → both iOS files show a TS error pointing at the missing field.

## Manual operations to configure services

None.
