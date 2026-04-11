# Ticket 002 — NavBar Alignment & Fix

## Acceptance Criteria

- As any authenticated user, on desktop, when I look at the top header, I should see 4 nav links: Home, Vendre, Activité, Profil
- As a seller, on desktop, the "Vendre" link should navigate to `/seller` instead of `/vendre`
- As any authenticated user, on desktop, the currently active page should be highlighted in the nav (primary background pill)
- As any user, on mobile, the hamburger sheet menu should remain accessible

## Technical Strategy

- Frontend
  - Component (`components/NavBar/NavBar.tsx`)
    - `NavBar`: Add missing `Link` import from `react-router-dom` (was causing a runtime crash)
    - `NavBar`: Add `useLocation` import to derive active route for highlight styling
    - `NavBar`: Change `hidden xl:flex` → `hidden lg:flex` and `xl:hidden` → `lg:hidden` to align breakpoint with the app-wide `lg` threshold
    - `NavBar`: Replace the old `HoverMenu` groups (`/dashboard`, `/channels`, `/pending-deliveries`) in the desktop nav with 4 direct `<Link>` items: Home (`/home`), Vendre (`/vendre` or `/seller` for sellers), Activité (`/my-orders`), Profil (`/profile`)
    - `NavBar`: Apply `bg-primary text-primary-foreground` active pill via `pathname.startsWith(to)` comparison
    - `NavBar`: Update logo text from "WhyNot" → "Popup" (correct brand name)

### Manual operations to configure services

- None
