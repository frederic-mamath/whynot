# Ticket 2 — "Inventaire" tab + Store button scroll

## Acceptance Criteria

- As a seller/host, in the "Inventaire" tab, when I view the list, I should see all my shop's products with an "Associer au live" button on each ProductCard.
- As a seller/host, in the "Inventaire" tab, when I type in the search bar, I should see only the products whose name matches my query.
- As a seller/host, in the "Inventaire" tab, when I click "Associer au live" on a product, it is immediately linked to the live and appears in "Boutique du live".
- As a user, in the 1st MobilePage, when I click the Store icon button, the page scrolls smoothly to the top of the 2nd MobilePage.

## Technical Strategy

- Frontend
  - Component (`app/client/src/pages/LiveDetailsPage/ProductCard/ProductCard.tsx`)
    - Add variant `"host-inventaire"`: renders "Associer au live" button, `onAssociate?: () => void` prop
  - Page (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`)
    - `shopPageRef = useRef<HTMLDivElement>(null)` — attached to the 2nd MobilePage wrapper div
    - Store `IconButton` `onClick`: `shopPageRef.current?.scrollIntoView({ behavior: "smooth" })`
    - "Inventaire" tab: render `ProductList` from `shopProducts` (via `useShop`) with `variant="host-inventaire"`
    - Filter `shopProducts` by `searchQuery` for the Inventaire tab
  - Hook (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`)
    - In `useShop`: add `associateMutation = trpc.product.associateToChannel.useMutation()` with `onSuccess` that invalidates `product.listByChannel`
    - Return `associateProduct: (productId: number) => void` from `useShop`

## Manual operations to configure services

None.
