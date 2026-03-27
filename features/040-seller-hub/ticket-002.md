# Ticket 002 — Inventaire Page Redesign

## Acceptance Criteria

- As a seller, in the Inventaire page, when I look at the page, I should see a subtitle describing the page's purpose below the header
- As a seller, in the Inventaire page, when I look at the page, I should see a full-width "+ ajouter un nouveau produit" inline button instead of a floating action button
- As a seller, in the Inventaire page, when I look at the product list, I should see each product as a vertical card with a large full-width landscape image at the top
- As a seller, in the Inventaire page, when a product has no image, I should see a muted placeholder with a Package icon
- As a seller, in the Inventaire page, when I look at a product card, I should see the product name and description (truncated to 2 lines) below the image
- As a seller, in the Inventaire page, when I tap the edit button on a product card, I should be navigated to the product edit page
- As a seller, in the Inventaire page, when I tap the delete button on a product card, I should see a confirmation dialog before the product is deleted
- As a seller, in the Inventaire page, after confirming deletion, the product should be removed and the list should refresh

## Technical Strategy

- Frontend
  - Component (`app/client/src/components/ShopProductItem/ShopProductItem.tsx`)
    - Full redesign from horizontal row to vertical card layout
    - Image: full-width `h-40` area with `object-cover`; falls back to `Package` icon on `bg-muted`
    - Content area: product name (`font-outfit font-semibold text-sm`) + description (`text-xs text-muted line-clamp-2`)
    - Edit button: `useNavigate` → `/seller/shop/products/${id}/edit` (existing `ProductUpdatePage`)
    - Delete button: opens `AlertDialog` (from `@/components/ui/alert-dialog`)
    - `trpc.product.delete.useMutation({ productId })` — on success: `utils.product.list.invalidate()` + `toast.success`
    - Removed props: `desiredPrice`, `startingPrice`, `isAssociatedToALive` (not shown in wireframe)
    - Added prop: `description?: string | null`
  - Component (`app/client/src/pages/SellerShopPage/MyShopTab/MyShopTab.tsx`)
    - Removed "Mes produits" section header and product count badge
    - Now passes `description={product.description}` to `ShopProductItem`
    - Removed unused props (`desiredPrice`, `startingPrice`, `isAssociatedToALive`)
  - Page (`app/client/src/pages/SellerShopPage/SellerShopPage.tsx`)
    - Removed "Passer en live" `ButtonV2` button
    - Removed floating action button (FAB fixed at bottom-24)
    - Added subtitle paragraph below the header
    - Added full-width inline "+ ajouter un nouveau produit" ghost button triggering `CreateProductDialog`

## Manual operations to configure services

None — no third-party service configuration required.
