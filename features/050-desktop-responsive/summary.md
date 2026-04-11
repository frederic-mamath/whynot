# Feature 050 — Desktop Responsive

## Initial Prompt

> Today, the application has a very strong focus on mobile. I want you to act like a UX designer and find suggestions to implement the responsive version for Desktop.

---

## Design Decisions

| Decision | Choice |
| :------- | :----- |
| Desktop navigation | Top header bar (replaces bottom nav on `lg+`) |
| Hero layout | Full-width banner, centered text |
| Max content width | 1280px (`max-w-[1280px]`) |
| Mobile → desktop breakpoint | `lg` (1024px) |
| Seller dashboard layout | Dedicated left sidebar (`w-56`) |
| Seller list on Home | Vertical stacked list (unchanged) |
| Live stream page | Full-screen overlays unchanged |

---

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a buyer, on any page (≥1024px), I should see a top header nav instead of the bottom nav | completed |
| As a buyer, on desktop, I should be able to navigate to Home, Vendre, Activité, Profil from the header | completed |
| As a seller, on desktop, inside `/seller/*`, I should see a persistent left sidebar with seller-specific nav | completed |
| As any user, on desktop, the content area should expand beyond 460px up to 1280px | completed |
| As a buyer, on the Home page on desktop, the next live hero card should be taller and more cinematic | completed |
| As a buyer, on the Home page on desktop, active live cards should display in a 2-column grid | completed |
| As any user, pages using the MobilePage wrapper should have proper desktop padding and centering | completed |
