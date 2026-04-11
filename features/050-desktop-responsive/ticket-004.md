# Ticket 004 — MobilePage Wrapper Responsive Padding

## Acceptance Criteria

- As any user, on desktop, pages that use the `MobilePage` wrapper (Profile, MyOrders, SellerUpsell, etc.) should have wider horizontal padding and be centered within the 1280px container

## Technical Strategy

- Frontend
  - Component (`components/ui/MobilePage/MobilePage.tsx`)
    - `MobilePage`: Add `lg:px-12 lg:py-10 lg:max-w-3xl lg:mx-auto` to the wrapper `<div>` — all consumer pages benefit automatically without individual changes

### Manual operations to configure services

- None
