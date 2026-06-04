# Ticket 012 — seller/lives/[id] decomposition

## Goal

Same shape as T-011 for `app/(tabs)/seller/lives/[id].tsx` (718 lines). It holds the live detail screen + EditLiveModal + ProductPickerModal under one shared `styles` block. Decompose.

After this ticket, the `// eslint-disable max-lines` annotation added in T-002 is removed.

## Acceptance Criteria

- As a seller, the live detail screen behaves identically — edit metadata, attach/detach products, view attendees, navigate to broadcaster — no UX change
- As a developer, `app/(tabs)/seller/lives/[id].tsx` is under 400 lines
- As a developer, the `// eslint-disable max-lines` annotation is removed
- As a developer, `npm run lint && npm run duplication` pass

## Technical Strategy

- Frontend / Extraction
  - `ios-app/src/components/seller-lives/EditLiveModal.tsx`
    - Props: `{ live, visible, onClose }`
    - Owns: form state, update mutation (via `useMutationWithToast`), scheduling pickers
  - `ios-app/src/components/seller-lives/ProductPickerModal.tsx`
    - Props: `{ liveId, currentProductIds, visible, onClose }`
    - Owns: shop product query, multi-select state, attach + detach mutations
  - `ios-app/src/components/seller-lives/AttachedProductsList.tsx`
    - Props: `{ products, onRemove }`
    - Owns: row rendering + remove handler invocation
- Frontend / Screen
  - `ios-app/app/(tabs)/seller/lives/[id].tsx`
    - Becomes: live header + attached products + 2 modals (controlled visibility) + go-live CTA
    - Target: ~250 lines

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint && npm run duplication
```

Manual: edit a live (title, cover, schedule), attach 2 products, detach 1, save, navigate to broadcaster.

## Manual operations to configure services

None.
