# Ticket 001 — Home sellers limit + "Voir tout" + /sellers page

## Acceptance Criteria

- As a buyer, on the home page, when the app loads, I should see at most 10 sellers in the "Premiers vendeurs" section.
- As a buyer, on the home page, when fewer than 11 sellers exist, I should not see the "Voir tout →" button.
- As a buyer, on the home page, when 11 or more sellers exist, I should see the "Voir tout →" button and tapping it navigates me to `/sellers`.
- As a buyer, on the `/sellers` page, I should see all sellers listed alphabetically by username (ASC).
- As a buyer, on the `/sellers` page, each seller row should show their username and two buttons: "Contacter" and "Suivre".
- As a buyer, on the `/sellers` page, when I hover over "Contacter" or "Suivre", I should see a tooltip "Bientôt disponible...".

---

## Technical Strategy

- **Backend**
  - Router
    - `app/src/routers/shop.ts`
      - `listSellers`: Add an optional `input` with `limit?: number`. When provided, query `limit + 1` rows (e.g. 11 when the home page requests 10). If the result length exceeds `limit`, slice to `limit` and set `hasMore: true`, otherwise `hasMore: false`. Return `{ sellers: Seller[], hasMore: boolean }`.
      - `listAllSellers`: New `protectedProcedure` — queries all shops with their owner nickname, ordered by `users.nickname ASC`. Returns only `{ userId, nickname }` (no categories needed). Used exclusively by the `/sellers` page.

- **Frontend**
  - Hook
    - `app/client/src/pages/HomePage.hooks.ts`
      - `useHomePage`: Pass `{ limit: 10 }` to `trpc.shop.listSellers.useQuery({ limit: 10 })`. Expose both `sellers` (from `data.sellers`) and `hasMoreSellers` (from `data.hasMore`).
  - View
    - `app/client/src/pages/HomePage.tsx`
      - "Voir tout" button: Conditionally render only when `hasMoreSellers === true`. Replace the `<button>` with a `<Link to="/sellers">` using the same styling.
  - Hook (new file)
    - `app/client/src/pages/SellersPage.hooks.ts`
      - `useSellersPage`: Calls `trpc.shop.listAllSellers.useQuery()`. Returns `{ sellers, isLoading }`.
  - View (new file)
    - `app/client/src/pages/SellersPage.tsx`
      - Renders a scrollable list of all sellers. Each row: seller nickname + two placeholder buttons ("Contacter", "Suivre").
      - Tooltip: use a Tailwind `relative group` wrapper on each button — a `<span>` with `absolute ... invisible group-hover:visible` shows "Bientôt disponible..." on hover.
      - Loading state: render 4 skeleton rows (same structure as HomePage skeletons).
      - Empty state: "Aucun vendeur pour l'instant."
  - Routing
    - `app/client/src/App.tsx`
      - Import `SellersPage` and add a new route: `<Route path="/sellers" element={<ProtectedRoute><OnboardingGuard><SellersPage /></OnboardingGuard></ProtectedRoute>} />`

---

## Manual operations to configure services

None.
