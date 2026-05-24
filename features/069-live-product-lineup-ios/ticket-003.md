# Ticket 003 — iOS: interest toggle with optimistic UI + seller count display

## Goal

Wire up the ✋ interest toggle on `LiveProductCard` for buyers. Sellers see counts but no toggle. Optimistic UI: state updates instantly on press, rolls back silently on server error.

## Acceptance Criteria

- As a buyer, when I tap ✋ on a product, the count increments and the icon highlights instantly — no loading state
- As a buyer, when I tap ✋ again on the same product, the count decrements and the icon returns to default instantly
- As a buyer, if the server returns an error, the count and icon state roll back to what they were before the tap
- As a seller viewing page 2 of their own live, I see the interest count on each product but have no toggle button
- The `isSellerView` flag on `LiveProductList` / `LiveProductCard` controls this: seller = count only, buyer = count + toggle

## Technical Strategy

- Screen (modify) — `ios-app/app/live/[liveId].tsx`
  - Determine `isSellerView`: check if `user?.id` matches the live host ID. The host ID is available from the `trpc.live.join` response (`data.channel?.host_id` or from `liveMeta`). Add a `const isHost = ...` derived from the join response, stored in state.
  - Pass `isSellerView={isHost}` to `LiveProductList`

- Component (modify) — `ios-app/src/components/live/LiveProductCard.tsx`
  - Add local state: `const [optimisticCount, setOptimisticCount] = useState(interestedCount)` and `const [optimisticInterested, setOptimisticInterested] = useState(isInterested)`
  - Sync with props via `useEffect`: when props change (after invalidation), update local state
  - `handleToggle`:
    ```ts
    const prev = { count: optimisticCount, interested: optimisticInterested };
    setOptimisticCount((c) => optimisticInterested ? c - 1 : c + 1);
    setOptimisticInterested((v) => !v);
    onToggleInterest?.({
      onError: () => {
        setOptimisticCount(prev.count);
        setOptimisticInterested(prev.interested);
      }
    });
    ```
  - Interest button: visible only when `!isSellerView`
    - Highlighted state (isInterested): `Colors.primary` background, white ✋
    - Default state: `Colors.border` background, `Colors.mutedForeground` ✋
    - Count always visible next to button regardless of role

- Screen (modify) — `ios-app/app/live/[liveId].tsx`
  - Add `toggleInterestMutation = trpc.product.toggleInterest.useMutation()`
  - Pass `onToggleInterest` to `LiveProductList` / `LiveProductCard`:
    ```ts
    onToggleInterest: ({ onError }) =>
      toggleInterestMutation.mutate(
        { productId: id, liveId: channelId },
        { onError }
      )
    ```
  - After mutation success: call `utils.product.listByChannel.invalidate({ channelId })` in background to sync true server counts

## Note on `isHost` detection

The live screen already has `user` from `useAuth()` and receives join response data. The join response at line ~92 in `[liveId].tsx` has `data.channel` — check if `data.channel?.host_id === user?.id` and store it as `const [isHost, setIsHost] = useState(false)`, set it in the `joinMutation.onSuccess` callback.

## Verification

```bash
cd ios-app && npx tsc --noEmit   # zero TypeScript errors
```

Manual checklist:
1. Buyer taps ✋ → count goes from 0 to 1 instantly, icon highlights
2. Buyer taps again → count goes back to 0 instantly, icon resets
3. Kill network → tap ✋ → count flickers up then rolls back to original
4. Seller account views page 2 → sees counts, no toggle button visible

## Manual operations to configure services

None.
