# Ticket 002 — Seller dashboard

## Goal

Replace the placeholder from ticket 001 with a real seller dashboard. The dashboard auto-creates the seller's shop on first visit and shows three navigation cards: Inventaire, Lives, Livraisons — each with a live count pulled from the server.

## Acceptance Criteria

- As a seller, when I tap Vendre, I see my shop name, and three cards: Inventaire (product count), Lives (upcoming count), Livraisons (pending deliveries count)
- As a seller with no shop yet, one is automatically created on arrival — I never see an error
- As a seller, when I tap Inventaire, I am navigated to the product list screen (stub — full screen in ticket 003)
- As a seller, when I tap Lives, I am navigated to the lives list screen (stub — full screen in ticket 005)
- As a seller, when I tap Livraisons, I am navigated to the deliveries screen (stub — full screen in ticket 009)

## Technical Strategy

- Screen — `ios-app/app/(tabs)/vendre.tsx` (modify)
  - Replace inline placeholder with navigation to `app/seller/index.tsx` using `useRouter().replace("/seller")`
  - Keep role gate: non-sellers still see `<SellerUpsell />`

- Screen — `ios-app/app/seller/index.tsx` (create)
  - `shop.getOrCreateMyShop.useQuery()` — fetches or creates shop; display `data.name`
  - `product.list.useQuery({ shopId })` — count products (enabled when shopId known)
  - `live.listByHost.useQuery()` — count `data.upcoming.length`
  - `order.getPendingDeliveries.useQuery()` — count pending items
  - Three `Pressable` cards arranged in a vertical list:
    - "Inventaire" → `router.push("/seller/products")`
    - "Lives" → `router.push("/seller/lives")`
    - "Livraisons" → `router.push("/seller/deliveries")`
  - Each card shows: title, count badge, chevron right icon
  - Loading state: `ActivityIndicator`

- Stub screens (create, minimal — just a back button + title, replaced in later tickets)
  - `ios-app/app/seller/products/index.tsx` — "Inventaire" placeholder
  - `ios-app/app/seller/lives/index.tsx` — "Lives" placeholder
  - `ios-app/app/seller/deliveries/index.tsx` — "Livraisons" placeholder

- Navigation — `ios-app/app/seller/_layout.tsx` (modify from ticket 001)
  - Add named screens: `index`, `products`, `lives`, `deliveries`

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Seller taps Vendre → dashboard loads with shop name and 3 cards with counts
2. Tap each card → navigates to placeholder screen
3. Back arrow returns to dashboard

## Manual operations to configure services

None.
