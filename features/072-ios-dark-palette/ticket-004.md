# Ticket 004 — Seller journey screens

## Goal

Audit and fix the seller-facing surfaces — Vendre upsell, seller dashboard, inventory, lives management, broadcaster live screen, deliveries — and their shared modals + pickers. After this ticket, the entire app is visually consistent in the new dark palette.

The broadcaster live screen and the lives detail screen are the most modal-heavy surfaces — auction creation sheet, product picker, edit live modal. Each modal needs its surfaces in `Colors.background` / `Colors.card` and its inputs in `Colors.input`.

## Acceptance Criteria

- As a non-seller, the Vendre upsell screen reads correctly (benefits rows, CTA, success/pending states)
- As a seller, my dashboard (Inventaire / Lives / Livraisons cards) is legible
- As a seller, my inventory list, create-product, and edit-product screens are legible (including image picker, active toggle, delete button)
- As a seller, my lives list, schedule live form, and live detail (with attached products + edit modal + product picker modal) all look right
- As a seller, the go-live broadcaster screen reads correctly — camera preview is unaffected, but the LIVE badge, viewer count, highlighted product banner, auction panel, auction creation sheet, and end-live button all use tokens
- As a seller, deliveries list + detail (with Mondial Relay form + manual tracking form) read correctly
- No new hex codes leak — `npm run arch:test` passes
- `npx tsc --noEmit` passes

## Technical Strategy

- Screens to audit:
  - `ios-app/app/(tabs)/vendre.tsx`
  - `ios-app/app/seller/_layout.tsx`
  - `ios-app/app/seller/index.tsx`
  - `ios-app/app/seller/products/index.tsx`
  - `ios-app/app/seller/products/new.tsx`
  - `ios-app/app/seller/products/[id].tsx`
  - `ios-app/app/seller/lives/index.tsx`
  - `ios-app/app/seller/lives/new.tsx`
  - `ios-app/app/seller/lives/[id].tsx`
  - `ios-app/app/seller/deliveries/index.tsx`
  - `ios-app/app/seller/deliveries/[id].tsx`
  - `ios-app/app/seller/live/[liveId].tsx` — broadcaster

- Pattern for each file (same as ticket-002 / 003):
  1. Find literal color strings
  2. Replace with `Colors.*` or justify
  3. Test visually

- Broadcaster screen specifics — `ios-app/app/seller/live/[liveId].tsx`:
  - Full-screen camera-preview container can stay `"black"` (the local Agora view fills it)
  - Overlay surfaces (LIVE badge red, viewer count chip, highlighted banner, auction panel) — these already use `rgba(...)` translucents over the camera. Leave them.
  - The "Démarrer le live" CTA uses `Colors.destructive` (red) intentionally — keep it red, regardless of palette. Don't switch to `Colors.primary` (yellow); the destructive red is what users expect for "go live".
  - The auction creation sheet and product picker sheet open as `Modal presentationStyle="pageSheet"` — these surfaces use `Colors.background` (now dark). Check input fields, chips, and buttons in those sheets.

- Modal/sheet checklist applies to:
  - Product picker in `seller/lives/[id].tsx`
  - Edit live modal in `seller/lives/[id].tsx`
  - Auction creation sheet + highlight picker in `seller/live/[liveId].tsx`

- Status chips on deliveries (`seller/deliveries/index.tsx` + `[id].tsx`):
  - Already use `Colors.success`/`info`/`muted`/`destructive` with matching foreground tokens. Those tokens are now updated (e.g. `success-foreground: #0D0D0D` instead of white). Verify the chip text reads correctly.

## Verification

```bash
cd ios-app
npx tsc --noEmit
npm run arch:test
```

Manual (requires a SELLER account):
1. As non-seller: Vendre tab → upsell looks polished, CTA visible
2. As seller: Vendre redirects to dashboard → 3 cards readable
3. Inventaire → product list + FAB → new product form → edit existing product (including delete button + active toggle)
4. Lives → schedule a live → detail screen → tap edit modal, then product picker → both modals work
5. Tap "Go Live" → broadcaster screen → LIVE start button red → highlight a product → launch an auction → end auction → end live
6. Livraisons → tap a pending Mondial Relay package → label form → tap a pending non-Mondial Relay package → manual tracking form

## Manual operations to configure services

None.
