# Ticket 011 — seller-live decomposition

## Goal

`app/seller-live/[liveId].tsx` is 937 lines and contains the broadcaster screen + a HighlightSheet modal + an AuctionSheet modal under a single shared `styles` block. Decompose into co-located sub-components.

After this ticket, the `// eslint-disable max-lines` annotation added in T-002 is removed.

## Acceptance Criteria

- As a seller, the broadcaster screen behaves identically (start live, highlight product, create auction, end auction, end live) — no UX change
- As a developer, `app/seller-live/[liveId].tsx` is under 400 lines (the ESLint `max-lines` limit)
- As a developer, the `// eslint-disable max-lines` annotation is removed
- As a developer, jscpd (from T-004) reports no duplication between the new components and the buyer-side `src/components/live/*` family
- As a developer, `npm run lint` enforces `max-lines: 400` on the file

## Technical Strategy

- Frontend / Extraction
  - `ios-app/src/components/seller-live/HighlightSheet.tsx`
    - Props: `{ channelId, visible, onClose }`
    - Owns: shop product query, highlight mutation (via `useMutationWithToast` from T-005), sheet header + list rendering
  - `ios-app/src/components/seller-live/AuctionSheet.tsx`
    - Props: `{ channelId, highlightedProduct, visible, onClose }`
    - Owns: duration chip selection, starting-price input, create-auction mutation
  - `ios-app/src/components/seller-live/BroadcasterTopBar.tsx`
    - Props: `{ isBroadcasting, onLeave, participantCount }`
    - Owns: close button, LIVE badge, viewer count
  - `ios-app/src/components/seller-live/BroadcasterBottomBar.tsx`
    - Props: `{ isBroadcasting, joinData, onStartLive, onOpenHighlight, onOpenAuction, onEndLive, highlightedProduct, activeAuction }`
    - Owns: start CTA + control buttons + terminate button
- Frontend / Screen
  - `ios-app/app/seller-live/[liveId].tsx`
    - Becomes: `useAgoraSession` (from T-007) + 4 sub-components + camera preview overlay + active auction panel + chat
    - Target: 250–300 lines, well under the 400-line ESLint limit
    - Each sub-component owns its own `StyleSheet` — no cross-component styles object

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint && npm run duplication
```

Manual: full seller flow — start live → highlight product → start auction → bid as a different test account → end auction → end live. Confirm no regression vs pre-decomposition behavior.

## Manual operations to configure services

None.
