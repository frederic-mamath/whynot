# Ticket 2 — ShopPanel Component

## Acceptance Criteria

- As a seller host, in the live details page, when I open the "My shop" panel, I should see all products from my shop.
- As a seller host, products already linked to the live should appear pre-checked.
- As a seller host, when I check/uncheck products and click "Confirmer", the products are associated or removed from the live.
- As a seller host, after confirming, the panel closes and the promoted products list is refreshed.

## Technical Strategy

- Frontend
  - Component (`app/client/src/components/ShopPanel/ShopPanel.tsx`)
    - `ShopPanel`: New self-contained panel component. Uses Shadcn `Sheet` (same pattern as `PromotedProducts`).
    - Props: `channelId: number`, `isOpen: boolean`, `onClose: () => void`
    - Internal queries:
      - `trpc.shop.getMyShop` → get `shopId`
      - `trpc.product.list({ shopId })` → all products from the shop
      - `trpc.product.listByChannel({ channelId })` → pre-check currently linked products
    - Local state: `selectedProductIds: number[]` initialized from `listByChannel` on open.
    - On confirm: diff selectedIds vs. original linked IDs → call `product.associateToChannel` for new ones, `product.removeFromChannel` for removed ones → invalidate `product.listByChannel` query → close panel.
    - Uses `ProductListSection` for the product list UI.
    - Footer: "Confirmer" button (disabled if no changes, shows loading during mutation).
  - Index (`app/client/src/components/ShopPanel/index.ts`)
    - Re-exports `ShopPanel` as default.

## Manual operations to configure services

None.
