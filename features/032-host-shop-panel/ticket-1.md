# Ticket 1 — Extract ProductListSection

## Acceptance Criteria

- As a developer, when I use the product selection UI in SellerLivesPage (new live form and edit dialog), it should render from the shared `ProductListSection` component.
- As a developer, the `ProductListSection` component accepts `products`, `selectedProductIds`, `onToggleProduct`, and `shopExists` props and renders identically to the current inline code.

## Technical Strategy

- Frontend
  - Component (`app/client/src/components/ProductListSection/ProductListSection.tsx`)
    - `ProductListSection`: New component extracted from the inline product selection section in `SellerLivesPage`.
    - Props: `products: Product[]`, `selectedProductIds: number[]`, `onToggleProduct: (id: number) => void`, `shopExists: boolean`, `onNavigateToShop: () => void`, `onNavigateToCreateProduct: () => void`
    - Renders: empty state (no shop), empty state (no products), section header with "Associer des produits" + select all/deselect all button, product cards with checkbox/image/name/price.
  - Index (`app/client/src/components/ProductListSection/index.ts`)
    - Re-exports `ProductListSection` as default.
  - Page (`app/client/src/pages/SellerLivesPage.tsx`)
    - Replace inline product section (new form ~L593-L695) with `<ProductListSection />`.
    - Replace inline product section (edit dialog ~L842-L880) with a simplified version or `<ProductListSection />` adapted to the dialog's compact style.

## Manual operations to configure services

None.
