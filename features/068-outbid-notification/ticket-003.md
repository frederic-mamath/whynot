# Ticket 003 — Web: outbid banner in LiveDetailsPage

## Goal

Mirror the iOS outbid notification on web. A banner appears over the auction panel when the current user is outbid, with a "Surenchérir" CTA that scrolls to / focuses the bid input.

## Acceptance Criteria

- As a buyer who was the highest bidder on web, when `auction:outbid` arrives with my `userId`, a banner appears at the top of the auction section
- The banner shows the product name and the new current bid amount
- The banner auto-dismisses after 4 seconds; I can also dismiss it with ✕
- Clicking "Surenchérir" closes the banner and scrolls the bid input into focus
- If I am NOT the outbid user, nothing happens
- The live page exception (no `setData`) is respected — this is pure local UI state

## Technical Strategy

- Hook (modify) — `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`
  - In the `useAuction` sub-hook, add state: `outbidBanner: { productName: string; newBid: number } | null`
  - In `subscribeToEvents.onData` (line ~578), add case:
    ```ts
    } else if (event.type === "auction:outbid" && event.outbidUserId === currentUser?.id) {
      setOutbidBanner({ productName: event.productName, newBid: event.currentBid });
    }
    ```
  - Expose `outbidBanner` and `setOutbidBanner` from `useAuction` return value
  - Expose `bidInputRef: useRef<HTMLInputElement>(null)` from `useAuction`, pass it to wherever the bid input is rendered so "Surenchérir" can call `bidInputRef.current?.focus()`

- Component (create) — `app/client/src/pages/LiveDetailsPage/OutbidBanner.tsx`
  - This is a view component only — no tRPC calls, no state (follows the headless pattern)
  - Props: `productName: string`, `newBid: number`, `onDismiss: () => void`, `onBidAgain: () => void`
  - Styled with design tokens: `bg-destructive/10`, `text-destructive`, `border-destructive/20`
  - Auto-dismiss via `useEffect` + `setTimeout(onDismiss, 4000)` — put this in the hook that controls `outbidBanner`, not in the component

  Wait — this component can't use `useEffect` per R2. Keep `useEffect` for auto-dismiss in the hook:
  ```ts
  useEffect(() => {
    if (!outbidBanner) return;
    const t = setTimeout(() => setOutbidBanner(null), 4000);
    return () => clearTimeout(t);
  }, [outbidBanner]);
  ```

- Page (modify) — `app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`
  - Render `<OutbidBanner>` above the bid section when `outbidBanner` is not null
  - `onBidAgain`: `setOutbidBanner(null); bidInputRef.current?.focus()`

## Verification

```bash
cd app && npm run build:client   # zero TypeScript errors
```

Manual checklist:
1. Account A wins bid on web → Account B places higher bid → Account A sees outbid banner appear
2. Banner auto-dismisses after 4 seconds
3. Clicking ✕ dismisses immediately
4. Clicking "Surenchérir" dismisses banner and focuses the bid input

## Manual operations to configure services

None.
