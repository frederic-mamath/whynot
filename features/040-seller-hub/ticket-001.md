# Ticket 001 — Seller Hub "Ma boutique"

## Acceptance Criteria

- As a seller, in BottomNav, when I tap "Vendre", I should land on the "Ma boutique" hub page instead of going directly to the shop
- As a seller, in the hub page, when I look at the page, I should see 4 navigation cards in a 2×2 grid: Inventaire, Lives, Livraisons, Analytics et dashboard — in the order of the seller workflow
- As a seller, in the hub page, when I look at each card, I should see a live count (number of products, upcoming lives, pending deliveries) so I know at a glance what needs attention
- As a seller, in the hub page, when the Livraisons count is greater than 0, I should see the count highlighted in the primary color as a visual alert
- As a seller, in the hub page, when I tap a card, I should be navigated to the corresponding section (Inventaire → `/seller/shop`, Lives → `/seller/lives`, Livraisons → `/pending-deliveries`, Analytics → `/seller/explorer`)
- As a seller, in Inventaire / Lives / Livraisons / Analytics pages, when I tap the back arrow, I should be returned to the hub
- As a seller, in BottomNav, when I am on any seller sub-page (including `/pending-deliveries`), the "Vendre" tab should appear active

## Technical Strategy

- Frontend
  - Page (`app/client/src/pages/SellerHomePage.tsx`)
    - Complete rewrite: 2×2 grid of navigation cards with Lucide icons (`Package`, `Video`, `Truck`, `BarChart2`)
    - `trpc.shop.getOrCreateMyShop` + `trpc.product.list`: product count for Inventaire card
    - `trpc.live.listByHost`: upcoming lives count (`data.upcoming.length`) for Lives card
    - `trpc.order.getPendingDeliveries`: pending count for Livraisons card; highlighted in `text-primary` when > 0
    - Counts display as `"—"` while loading (no skeleton flash)
  - Component (`app/client/src/components/BottomNav/BottomNav.tsx`)
    - `handleVendre`: changed destination from `/seller/shop` to `/seller`
    - Added `isVendreActive` logic: active when path starts with `/seller` OR `/pending-deliveries`
    - Moved `active` flag inline per nav item (removes shared `isActive` call in map)
  - Page (`app/client/src/pages/SellerShopPage/SellerShopPage.tsx`)
    - Added `useNavigate` + `ChevronLeft` back arrow → `/seller`
    - Header title changed to "Inventaire" (was "Ma boutique")
  - Page (`app/client/src/pages/SellerLivesPage.tsx`)
    - Added `ChevronLeft` import + back arrow header → `/seller`
  - Page (`app/client/src/pages/PendingDeliveriesPage/PendingDeliveriesPage.tsx`)
    - Added `useNavigate` + `ChevronLeft` import
    - Back arrow header added to both return paths (empty state + main render)
    - Section title "Livraisons" added
  - Page (`app/client/src/pages/SellerExplorerPage.tsx`)
    - Replaced stub with proper coming-soon layout: `BarChart2` icon, title, descriptive subtitle, back arrow → `/seller`

## Manual operations to configure services

None — no third-party service configuration required.
