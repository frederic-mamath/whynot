# Ticket 010 — optimisticUpdate helper + cache strategy sweep

## Goal

Codify the "setData → invalidate" cache convention from CLAUDE.md as a tiny helper, then sweep all non-live-session mutations to use it uniformly. Today some mutations only `invalidate` (causing the 200–500ms lag the convention says to avoid) and some mix patterns within a single file.

After this ticket, the "Cache Update Strategy" section of `ios-app/CLAUDE.md` shrinks to one line referencing the helper.

## Acceptance Criteria

- As a user, when I create / edit / delete an address, product, or live, the list reflects the change instantly without a loading flash
- As a user, when I update my profile, the new value appears in every place it's referenced (header, profile screen) immediately
- As a developer, every non-live-session mutation uses `optimisticUpdate(utils, query, updater)` followed by `invalidate()` in one consistent shape
- As a developer, the live-session exception is documented in one place (a comment in `useAgoraSession` from T-007 or near the live subscription handler) — not duplicated across screens

## Technical Strategy

- Frontend / Helper
  - `ios-app/src/lib/optimisticUpdate.ts`
    - `optimisticUpdate<TData>(query: { setData; invalidate }, updater: (old: TData | undefined) => TData | undefined): void`
    - Calls `query.setData(undefined, updater)` then schedules `query.invalidate()`
    - Re-exports a small `updateById<T extends { id: number | string }>(list, id, patch)` and `removeById(list, id)` for the most common list patterns
- Frontend / Migration (mechanical sweep)
  - `ios-app/app/(tabs)/seller/products/new.tsx` — `createMutation`: insert into `product.listByShop` optimistically
  - `ios-app/app/(tabs)/seller/products/[id].tsx` — `updateMutation`, `deleteMutation`: patch / remove by id
  - `ios-app/app/(tabs)/seller/lives/new.tsx` — `createMutation`: insert into `live.listByShop`
  - `ios-app/app/(tabs)/seller/lives/[id].tsx` — `updateMutation`, `addProducts`, `removeProduct`: patch attached-products list
  - `ios-app/app/address/new.tsx` — `createMutation`: insert into `profile.addresses.list`
  - `ios-app/app/address/[id].tsx` — confirm `delete` uses setData (today it doesn't)
  - `ios-app/app/address/relay.tsx` — `saveMutation`: insert relay point into address list
  - `ios-app/app/onboarding.tsx` — `update`: setData on `profile.me`
  - `ios-app/app/(tabs)/seller/deliveries/[id].tsx` — `markShipped` / `updateTracking`: patch by id
- Documentation
  - `ios-app/CLAUDE.md` — replace the "Cache Update Strategy" multi-paragraph section with: 1 sentence + reference to `src/lib/optimisticUpdate.ts` + reiterate the live-session exception

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint
```

Manual: edit your nickname in profile → no flash. Create a product → appears at top of list instantly. Delete an address → disappears immediately.

## Manual operations to configure services

None.
