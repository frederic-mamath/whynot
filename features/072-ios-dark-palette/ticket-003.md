# Ticket 003 — Buyer journey screens

## Goal

Audit and fix the four buyer-facing surfaces — home feed, lives tab, live viewer screen, orders — and their shared components (LiveCard, OrderCard, ChatPanel, AuctionWidget, etc.) so they look polished in the new palette.

The live viewer screen is the most visually loaded surface in the whole app (video underlay + multiple translucent overlays + chat + auction widget + outbid banner). Most of its overlays already use `rgba(0,0,0,0.6)` style translucents that work in any palette, but the labels and CTA colors need to be checked.

## Acceptance Criteria

- As a buyer, the home feed shows live cards with legible thumbnails, names, and live badges
- As a buyer, the lives tab (upcoming + past) reads correctly with the new palette
- As a buyer, when I enter a live with `liveStatus === "active"`, the video + LIVE badge + viewer count + highlighted product banner + auction widget + chat panel + outbid banner + auction end modal all read against the dark palette
- As a buyer, the page-2 product lineup on the live screen uses card surfaces from `Colors.card`, not the prior light surface
- As a buyer, the orders screen (and each OrderCard) reads correctly with status chips visible
- No new hex codes leak — `npm run arch:test` passes
- `npx tsc --noEmit` passes

## Technical Strategy

- Screens to audit:
  - `ios-app/app/(tabs)/index.tsx` — home feed
  - `ios-app/app/(tabs)/lives.tsx` — upcoming + past lives
  - `ios-app/app/(tabs)/orders.tsx` — orders list + Stripe pay flow
  - `ios-app/app/live/[liveId].tsx` — buyer live screen

- Shared components used by the buyer flow (audit + fix):
  - `ios-app/src/components/LiveCard.tsx`
  - `ios-app/src/components/OrderCard.tsx`
  - `ios-app/src/components/live/LiveBadge.tsx`
  - `ios-app/src/components/live/HighlightedProduct.tsx`
  - `ios-app/src/components/live/AuctionWidget.tsx`
  - `ios-app/src/components/live/AuctionCountdown.tsx`
  - `ios-app/src/components/live/AuctionEndModal.tsx`
  - `ios-app/src/components/live/BidRequirementsSheet.tsx`
  - `ios-app/src/components/live/ChatPanel.tsx`
  - `ios-app/src/components/live/OutbidBanner.tsx`
  - `ios-app/src/components/live/LiveProductList.tsx`
  - `ios-app/src/components/live/LiveProductCard.tsx`
  - `ios-app/src/components/live/PaymentSetupSheet.tsx`
  - `ios-app/src/components/live/PersonalInfoForm.tsx`
  - `ios-app/src/components/live/SwipeToConfirm.tsx`

- Pattern for each file:
  1. Find any literal color string (`#`, `"rgb"`, `"rgba"`, `"white"`, `"black"`)
  2. For each: either replace with `Colors.*` OR justify keeping it
  3. **Translucent overlays on video are legitimate** — `rgba(0,0,0,0.5)` over the Agora video feed reads as a scrim regardless of palette. Leave those.
  4. **White text on the video underlay is legitimate** — the live screen overlays text on video, so white reads against the underlying frames. Leave those `"white"` or `"#fff"` uses, but add a brief comment if not already justified.

- Live screen specifically — `ios-app/app/live/[liveId].tsx`:
  - The full-screen black container is fine (video underlay).
  - The page-2 product lineup background should be `Colors.background` (which is now dark — same as page 1).
  - The "Produits du live" cue text already uses `rgba(255,255,255,0.45)` — leave it.

- Orders — `ios-app/app/(tabs)/orders.tsx` + `OrderCard.tsx`:
  - Status chips (pending / paid / shipped) should use the success/warning/info tokens consistently. Verify the foreground colors are dark enough against the new yellow/green tones (the dark palette uses `success-foreground: #0D0D0D` exactly for this).

## Verification

```bash
cd ios-app
npx tsc --noEmit
npm run arch:test
```

Manual:
1. Open home tab — live cards readable
2. Open lives tab — upcoming/past sections readable
3. Tap an active live → enter the live screen:
   - Video plays full-screen
   - LIVE badge + back button overlay legible
   - Highlighted product banner readable
   - Auction widget bottom-anchored, legible
   - Chat panel messages readable
   - If outbid, banner appears with correct colors
4. Open orders tab — list + status chips visible
5. Pay an order via Apple Pay — Stripe sheet styling is native (not our responsibility), but the trigger button + post-pay state must match palette

## Manual operations to configure services

None.
