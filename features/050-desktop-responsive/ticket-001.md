# Ticket 001 — App Shell Foundation

## Acceptance Criteria

- As any authenticated user, on a desktop browser (≥1024px), when I visit any page, I should see a top header navigation bar instead of the bottom tab bar
- As any authenticated user, on a mobile browser (<1024px), when I visit any page, I should still see the bottom tab bar as before
- As any authenticated user, on desktop, the main content area should expand beyond 460px up to a maximum of 1280px

## Technical Strategy

- Frontend
  - Layout (`App.tsx`)
    - `AppContent`: Import and mount `<NavBar />` above `<Routes>`, conditional on `showBottomNav`
    - `AppContent`: Replace `max-w-[460px] flex-1` container class with `w-full flex-1 mx-auto lg:max-w-[1280px]`
    - `AppContent`: Replace `pb-20` bottom padding with `pb-20 lg:pb-0` so the nav spacer disappears on desktop
  - Component (`components/BottomNav/BottomNav.tsx`)
    - `BottomNav`: Add `lg:hidden` to the outer `<nav>` to hide on desktop
    - `BottomNav`: Remove `max-w-[460px]` constraint (no longer needed)

### Manual operations to configure services

- None
