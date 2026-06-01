# Ticket 008 — Go live screen (broadcaster)

## Goal

Replace the stub go-live screen with a full seller broadcasting experience. The seller sees their own camera, can start/stop the broadcast, highlight products from the live's lineup, launch and manage real-time auctions, and see the chat. All auction controls mirror what the web app offers.

## Acceptance Criteria

- As a seller, when I enter the go-live screen, I see my camera preview full-screen
- As a seller, I see a "Démarrer le live" button; tapping it begins broadcasting (Agora host join)
- As a seller, once live, I see: viewer count, a product highlight picker, the chat panel
- As a seller, I can tap any product from my lineup to highlight it (appears on all viewers' screens)
- As a seller, when a product is highlighted, I see a "Lancer une enchère" button
- As a seller, when I tap "Lancer une enchère", I fill in: duration (preset buttons: 30s, 60s, 90s), starting price (pre-filled from product's starting_price), optional buyout price
- As a seller, once an auction is running, I see: current highest bid, time remaining countdown, "Prolonger +30s" and "Terminer" buttons
- As a seller, I can end the live at any time via a "Terminer le live" button with a confirm alert → calls `live.end`
- As a seller, the chat is visible in a panel at the bottom (read-only display, same `ChatPanel` component)

## Technical Strategy

- Screen — `ios-app/app/seller/live/[liveId].tsx` (replace stub)
  - State: `isBroadcasting`, `isJoined`, `highlightedProductId`, `activeAuction`, `timeRemaining`
  - On mount: `initializeBroadcaster()` → show local preview via `<RtcLocalView />`
  - "Démarrer le live": `live.join.mutate({ channelId })` to get token → `joinChannelAsBroadcaster(token, channelName, uid)` → `setIsBroadcasting(true)`
  - tRPC subscriptions (once broadcasting):
    - `live.subscribeToEvents` — listen for bid updates to refresh auction state
    - `auction.getActive.useQuery({ channelId })` — poll or subscribe for current auction

  - Product highlight panel (bottom sheet, shows when broadcasting):
    - `product.listByChannel.useQuery({ channelId })` — the live's attached products
    - Each product row: thumbnail + name; tap → `live.highlightProduct.mutate({ channelId, productId })`
    - "Désélectionner" → `live.unhighlightProduct.mutate({ channelId })`

  - Auction creation sheet (shown after highlight, when no active auction):
    - Duration presets: `[30, 60, 90]` seconds as `Pressable` chips
    - Starting price: `TextInput` (numeric, pre-filled from product)
    - Buyout price: optional `TextInput`
    - "Lancer" → `auction.start.mutate({ channelId, productId, durationSeconds, startingPrice, buyoutPrice })`

  - Auction live panel (shown when `activeAuction` exists):
    - Current bid, highest bidder nickname, `AuctionCountdown` component (already exists in `src/components/live/`)
    - "Prolonger +30s": extend logic (if `auction.extend` exists on backend; else client-side time extension via re-start — check router first)
    - "Terminer": `auction.close.mutate({ auctionId })`

  - "Terminer le live": `Alert.alert` confirm → `live.end.mutate({ channelId })` → `stopBroadcaster()` → `router.back()`

  - Cleanup on unmount: `stopBroadcaster()`

  - Chat: `<ChatPanel channelId={channelId} />` — same component used in buyer screen

- Note on `auction.extend`: check `app/src/routers/auction.ts` before implementing — if it doesn't exist, the "Prolonger" button calls `auction.close` + `auction.start` with remaining time + 30s. Document the workaround in code with a comment.

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual (requires two devices or simulator + device):
1. Seller opens go-live screen → sees camera preview
2. Taps "Démarrer" → buyers in live see seller video
3. Seller taps product → buyers see highlight banner
4. Seller launches auction → countdown visible on both devices; bids from buyer update seller's panel
5. Seller taps "Terminer le live" → live ends on both sides

## Manual operations to configure services

None.
