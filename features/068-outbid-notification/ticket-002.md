# Ticket 002 — iOS: `OutbidBanner` in live screen

## Goal

Show a non-blocking animated banner at the top of the live screen when the current user is outbid. The banner auto-dismisses after 4 seconds and has a "Enchérir à nouveau" CTA that opens the bid sheet.

## Acceptance Criteria

- As a buyer who was the highest bidder, when I receive `auction:outbid` with my `userId`, a banner slides in from the top of the live screen
- The banner shows the product name and the new current bid amount
- The banner has haptic feedback when it appears
- The banner auto-dismisses after 4 seconds; I can also dismiss it manually
- Tapping "Enchérir à nouveau" closes the banner and opens the bid sheet (pre-filled with the current minimum bid via `AuctionWidget`'s existing query)
- If I am NOT the outbid user (`outbidUserId !== user.id`), nothing happens
- The live page exception (no `setData`) is respected — this is pure local UI state

## Technical Strategy

- Component (create) — `ios-app/src/components/live/OutbidBanner.tsx`
  - Props: `visible: boolean`, `productName: string`, `newBid: number`, `onDismiss: () => void`, `onBidAgain: () => void`
  - Animated `translateY` from `-80` to `0` on mount, reverse on dismiss
  - `useEffect`: when `visible` becomes true, trigger haptic (`ReactNative.Vibration.vibrate(50)` or `HapticFeedback`) and start a 4-second auto-dismiss timer
  - Layout: positioned absolutely at top of screen, full-width card with banner message + dismiss `✕` + "Enchérir à nouveau" `Pressable`
  - Colors from `Colors.*` tokens only — no hex

- Component (modify) — `ios-app/src/components/live/AuctionWidget.tsx`
  - Add optional props: `forceOpen?: boolean`, `onForceOpenHandled?: () => void`
  - When `forceOpen` becomes `true`, call `setSheetOpen(true)` and `onForceOpenHandled()`
  - This avoids lifting all of `sheetOpen` state up while still allowing external trigger

- Screen (modify) — `ios-app/app/live/[liveId].tsx`
  - Add state: `outbidBanner: { productName: string; newBid: number } | null`
  - Add state: `openBidSheet: boolean` (triggers `AuctionWidget.forceOpen`)
  - In `subscribeToEvents.onData`, add case:
    ```ts
    } else if (e.type === "auction:outbid" && e.outbidUserId === user?.id) {
      setOutbidBanner({ productName: e.productName, newBid: e.currentBid });
    }
    ```
  - Render `<OutbidBanner>` above `<AuctionWidget>` when `outbidBanner` is not null
  - Pass `forceOpen={openBidSheet}` and `onForceOpenHandled={() => setOpenBidSheet(false)}` to `AuctionWidget`
  - `onBidAgain` in `OutbidBanner`: `setOutbidBanner(null); setOpenBidSheet(true)`

## Verification

```bash
cd ios-app && npx tsc --noEmit   # zero TypeScript errors
```

Manual checklist:
1. Account A wins bid on a live → Account B places higher bid → Account A sees outbid banner slide in from top
2. Banner auto-dismisses after 4 seconds
3. Tapping ✕ dismisses immediately
4. Tapping "Enchérir à nouveau" dismisses banner and opens bid sheet with correct minimum

## Manual operations to configure services

None.
