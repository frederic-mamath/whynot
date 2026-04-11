# Ticket 005 — HomePage Responsive Layout

## Acceptance Criteria

- As a buyer, on desktop, when I visit the Home page, the upcoming live hero card should be taller (more cinematic) than on mobile
- As a buyer, on desktop, when there are active live cards in the "En direct maintenant" section, they should display in a 2-column grid instead of a single column

## Technical Strategy

- Frontend
  - Page (`pages/HomePage.tsx`)
    - Root `<div>`: Add `lg:px-8 lg:pt-10` for wider desktop padding
    - Active lives grid: Change `flex flex-col gap-3` → `flex flex-col lg:grid lg:grid-cols-2 gap-3`
  - Component (`components/LiveHighlight/LiveHighlight.tsx`)
    - Hero wrapper `<div>`: Add `lg:min-h-[480px]` alongside the existing `min-h-[360px]` to make the banner taller on desktop

### Manual operations to configure services

- None
