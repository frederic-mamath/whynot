# Ticket 003 — Seller Dashboard Sidebar

## Acceptance Criteria

- As a seller, on desktop (≥1024px), when I navigate to any `/seller/*` page, I should see a persistent left sidebar with links: Accueil, Boutique, Lives, Livraisons, Explorer
- As a seller, on desktop, the sidebar link corresponding to my current page should be highlighted
- As a seller, on mobile, the sidebar should not appear (existing bottom nav handles navigation)

## Technical Strategy

- Frontend
  - Layout (`pages/SellerLayout.tsx`)
    - `SellerLayout`: Replace the bare `<Outlet />` wrapper with a flex layout (`lg:flex`)
    - `SellerLayout`: Add a `<aside>` with `hidden lg:flex flex-col w-56 border-r border-border sticky top-16 h-[calc(100vh-4rem)]` for the desktop sidebar
    - `SidebarLink` (inline helper, not exported): Renders a `<NavLink>` with active/inactive styling using `bg-primary text-primary-foreground` vs `text-muted-foreground hover:text-foreground hover:bg-accent`
    - Sidebar links: Accueil → `/seller` (end match), Boutique → `/seller/shop`, Lives → `/seller/lives`, Livraisons → `/seller/livraisons`, Explorer → `/seller/explorer`
    - Icons: `Home`, `Store`, `Video`, `Package`, `Compass` from lucide-react

### Manual operations to configure services

- None
