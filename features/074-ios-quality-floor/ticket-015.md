# Ticket 015 — useRefreshControl + useConfirm hooks

## Goal

Two small hooks that close out the remaining audit M items. Each unifies a pattern that's reinvented per-screen today.

After this ticket, `Alert.alert` is fully gated by R6 — only `src/lib/alerts.ts` remains in `R6_EXCLUDE`.

## Acceptance Criteria

- As a user, when I pull-to-refresh a list, the spinner appears only during my refresh — not during background refetches
- As a user, when I confirm a destructive action (delete address, product, live, payment method), the dialog wording and style is consistent across the app
- As a developer, `useRefreshControl(query)` is the only entry point for `<RefreshControl>` setup
- As a developer, `useConfirm({...})` (backed by `src/lib/alerts.ts` from T-005) is the only confirmation dialog entry point
- As a developer, `npm run arch:test` passes with R6 enforced

## Technical Strategy

- Frontend / Hooks
  - `ios-app/src/hooks/useRefreshControl.ts`
    - `useRefreshControl(query: { refetch: () => Promise<unknown>; isFetching: boolean })` → `{ refreshing: boolean; onRefresh: () => Promise<void> }`
    - Owns an internal `manualRefreshing` flag: set true on `onRefresh`, awaits `refetch()`, sets false. The returned `refreshing` is `manualRefreshing`, NOT `isFetching` — so background refetches don't show the spinner.
  - `ios-app/src/hooks/useConfirm.ts`
    - `useConfirm({ title, message, destructiveLabel?, cancelLabel? }): (onConfirm: () => void) => Promise<void>`
    - Internally calls `confirm(...)` from `src/lib/alerts.ts` (T-005) and invokes `onConfirm` if the user confirms
- Frontend / Migration — useRefreshControl
  - `ios-app/app/(tabs)/index.tsx` — replace ad-hoc `Promise.all` invalidate
  - `ios-app/app/(tabs)/lives.tsx` — replace raw `isFetching`
  - `ios-app/app/(tabs)/orders.tsx` — replace `isFetching && !isLoading`
  - `ios-app/app/address/index.tsx` — replace raw `isFetching`
  - `ios-app/app/(tabs)/seller/products/index.tsx`, `lives/index.tsx`, `deliveries/index.tsx` — same
- Frontend / Migration — useConfirm
  - `ios-app/app/(tabs)/profile.tsx` — delete-account confirm
  - `ios-app/app/address/[id].tsx`, `address/index.tsx` — delete-address confirm
  - `ios-app/app/(tabs)/seller/products/[id].tsx` — delete-product confirm
  - `ios-app/app/(tabs)/seller/lives/[id].tsx` — delete-live, end-live confirms
  - `ios-app/app/seller-live/[liveId].tsx` — end-live confirm (if present)
- Arch-test cleanup
  - `scripts/arch-test.mjs` — `R6_EXCLUDE` is now `["ios-app/src/lib/alerts.ts"]` only

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint
```

Manual: pull to refresh on every tab — spinner only shows during pull. Trigger every destructive action — dialog shape is identical.

## Manual operations to configure services

None.
