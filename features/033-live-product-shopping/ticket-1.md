# Ticket 1 — ProductCard variants + "Boutique du live" tab

## Acceptance Criteria

- As a buyer, in the 2nd MobilePage of LiveDetailsPage, when I view the product list, I should see each product in a ProductCard with its image, name, price, and a "Enregistrer et me prévenir" button.
- As a buyer, in the 2nd MobilePage, when I type in the search bar, I should see only the products whose name matches my query.
- As a seller/host, in the 2nd MobilePage, when I open the page, I should see two tabs: "Boutique du live" and "Inventaire".
- As a seller/host, in the "Boutique du live" tab, when I view a product that is not highlighted, I should see a "Mettre en avant" button.
- As a seller/host, in the "Boutique du live" tab, when I view the currently highlighted product, I should see a "Retirer de la mise en avant" button.
- As a seller/host, when I click "Mettre en avant", the product becomes highlighted in the live for all viewers.
- As a seller/host, when I click "Retirer de la mise en avant", the product is no longer highlighted.

## Technical Strategy

- Frontend
  - Component (`app/client/src/pages/LiveDetailsPage/ProductCard/ProductCard.tsx`)
    - Add prop `variant: "buyer" | "host-boutique"` and `onHighlight?: () => void`, `onUnhighlight?: () => void`, `isHighlighted?: boolean`
    - `"buyer"` variant: renders "Enregistrer et me prévenir" button (existing behaviour)
    - `"host-boutique"` variant: renders "Mettre en avant" or "Retirer de la mise en avant" (toggle based on `isHighlighted`)
  - Component (`app/client/src/pages/LiveDetailsPage/ProductList/ProductList.tsx`)
    - Add props: `variant`, `highlightedProductId`, `onHighlight`, `onUnhighlight`
    - Pass variant and highlight state down to each `ProductCard`
  - Page (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`)
    - Add `useState<string>` for `searchQuery` and `activeTab` (`"boutique" | "inventaire"`)
    - Add `useRef` for the 2nd MobilePage div (`shopPageRef`)
    - Filter `linkedProducts` by `searchQuery` (case-insensitive name match)
    - Render `Tabs` component with "Boutique du live" / "Inventaire" items (only when host)
    - Render `ProductList` in "Boutique du live" tab with `variant="host-boutique"` for host, `variant="buyer"` otherwise
  - Hook (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`)
    - In `useAgora`: expose `highlightedProduct` (already exported) and `channelConfig`
    - Add `highlightMutation` and `unhighlightMutation` inside `useShop` or a new `useHighlight(liveId)` hook

## Manual operations to configure services

None.
