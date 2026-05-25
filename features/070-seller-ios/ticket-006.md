# Ticket 006 — Live detail: product attachment + go live entry point

## Goal

Tapping a live in the list opens a detail screen. The seller can attach/detach products from the live and see a "Go Live" button that launches the broadcasting screen (built in ticket 008 — the button navigates there but the screen may still be a stub at this point).

## Acceptance Criteria

- As a seller, when I tap an upcoming live, I see its name, date, description, and the list of products attached to it
- As a seller, I see an "Ajouter des produits" button that opens a bottom sheet listing all my products with checkboxes
- As a seller, when I check a product in the sheet, it is attached to the live immediately
- As a seller, when I uncheck an attached product, it is removed from the live immediately
- As a seller, I see a "Go Live" CTA button — tapping it navigates to `app/seller/live/[liveId].tsx`
- As a seller, I can edit the live details (name, date, description) via an "Éditer" button that opens the edit form inline or as a new screen
- As a seller, I can delete the live via a "Supprimer" action with a confirm alert

## Technical Strategy

- Screen — `ios-app/app/seller/lives/[id].tsx` (create)
  - `live.get.useQuery({ channelId: liveId })` for live metadata
  - `product.listByChannel.useQuery({ channelId: liveId })` for attached products
  - `shop.getOrCreateMyShop.useQuery()` + `product.list.useQuery({ shopId })` for the full product pool (needed for the picker sheet)
  - Attached products: `FlatList` with remove icon on each row → `product.removeFromChannel.useMutation()` with optimistic removal
  - "Ajouter des produits" button → opens `Modal` / bottom sheet:
    - All seller products listed as checkable rows
    - Already-attached products shown as checked
    - Tap unchecked → `product.associateToChannel.useMutation()` → append to cache
    - Tap checked → `product.removeFromChannel.useMutation()` → remove from cache
  - "Go Live" button (primary, full-width): `router.push("/seller/live/" + liveId)`
    - Only shown for upcoming lives (not past)
  - "Éditer" icon in header → `router.push("/seller/lives/" + liveId + "/edit")` or inline modal
  - "Supprimer": `Alert.alert` confirm → `live.delete.mutate()` → `router.back()`

- Screen — `ios-app/app/seller/lives/[id]/edit.tsx` (create, optional) OR inline edit modal in `[id].tsx`
  - Same form as `new.tsx` but pre-filled; calls `live.update.mutate()`
  - Simplest approach: inline modal in `[id].tsx` to avoid navigation complexity

- Stub screen — `ios-app/app/seller/live/[liveId].tsx` (create, minimal)
  - Just a full-screen black view with "Go Live — à venir" text and a back button
  - This is replaced in full in ticket 008

- Navigation — `ios-app/app/seller/_layout.tsx`
  - Add `lives/[id]` and `seller/live/[liveId]` to Stack

- Live list — `ios-app/app/seller/lives/index.tsx` (modify)
  - Make each row a `Pressable` → `router.push("/seller/lives/" + item.id)`

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Tap live → detail screen with product list
2. Tap "Ajouter" → product picker shows all products; checking one adds it to list
3. Unchecking removes it
4. Tap "Go Live" → stub screen opens (black with back button)
5. Tap "Supprimer" → confirm → back to list, live removed

## Manual operations to configure services

None.
