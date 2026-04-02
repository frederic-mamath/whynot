# Ticket 004 — Frontend: semantic status tokens + fix raw color classes

## Acceptance Criteria

- As a developer, status colors (success, warning, info) should be defined as design tokens in `index.css`, not hardcoded Tailwind color classes
- As a developer, `OrderCard` paid/shipped badges should use `bg-success` / `bg-info` instead of `bg-green-500` / `bg-blue-500`
- As a developer, `PackageCard` delivered/shipped status badges should use `bg-success/20 text-success` / `bg-info/20 text-info`
- As a developer, `ShopListPage` and `ShopDetailsPage` role badges should use `bg-primary/20` and `bg-success/20` instead of raw indigo/green
- As a developer, the live badge in `ChannelDetailsPage` should use `bg-destructive` instead of `bg-red-600`

## Technical Strategy

- Frontend
  - Configuration
    - `app/client/src/index.css` *(modified)*
      - Added `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground` CSS variables in `:root`
      - Registered them as `--color-success`, `--color-info`, `--color-warning` etc. in `@theme inline` so Tailwind generates utility classes
  - Component
    - `app/client/src/components/OrderCard/OrderCard.tsx` *(modified)*
      - Replace `bg-green-500 hover:bg-green-600` with `bg-success hover:bg-success/80 text-success-foreground`
      - Replace `bg-blue-500 hover:bg-blue-600` with `bg-info hover:bg-info/80 text-info-foreground`
    - `app/client/src/pages/SellerDeliveriesPage/PackageCard.tsx` *(modified)*
      - Replace `bg-blue-500/20 text-blue-600` (shipped) with `bg-info/20 text-info`
      - Replace `bg-green-500/20 text-green-600` (delivered) with `bg-success/20 text-success`
    - `app/client/src/pages/ShopListPage.tsx` *(modified)*
      - Replace `hover:border-indigo-500` with `hover:border-primary`
      - Replace `bg-indigo-100 text-indigo-800` (owner badge) with `bg-primary/20 text-primary`
      - Replace `bg-green-100 text-green-800` (vendor badge) with `bg-success/20 text-success`
    - `app/client/src/pages/ShopDetailsPage.tsx` *(modified)*
      - Same badge replacements as ShopListPage
    - `app/client/src/pages/ChannelDetailsPage.tsx` *(modified)*
      - Replace `bg-red-600` on live badge with `bg-destructive` (already in design tokens)
