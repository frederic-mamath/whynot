# Ticket 002 — /lives page: active + upcoming lives with category filters and sort

## Acceptance Criteria

- As a buyer, on `/lives`, I should see all currently active lives (started, not ended, `ends_at` is null or in the future) and all upcoming lives (not yet started, not ended), regardless of how long they have been running.
- As a buyer, on `/lives`, I can filter lives by product category using multi-select pill chips. Selecting a category shows lives that have at least one product in that category. Multiple categories can be active at once (OR logic).
- As a buyer, on `/lives`, I can sort the list by title (A→Z) or by start date (earliest first) using two adjacent pill chips. The active sort is filled in primary color; the inactive one is outlined.
- As a buyer, on `/lives`, I can tap a live card to navigate to `/live/:id`.

---

## Technical Strategy

- **Backend**
  - Router
    - `app/src/routers/live.ts`
      - `listDiscovery`: New `publicProcedure` query. Returns all active and upcoming lives with their product categories.
        - Active: `starts_at <= now AND (ends_at IS NULL OR ends_at > now) AND ended_at IS NULL`
        - Upcoming: `starts_at > now AND ended_at IS NULL`
        - For each live, fetch distinct category names via a join: `live_products → products → categories`.
        - Returns: `{ id, name, starts_at, cover_url, host_nickname, host_avatar_url, isActive: boolean, categories: string[] }`
        - Default ordering: `starts_at ASC` (closest upcoming/most-recent first). Sorting is handled client-side.

- **Frontend**
  - Hook (new file)
    - `app/client/src/pages/LivesPage/LivesPage.hooks.ts`
      - `useLivesPage`: Calls `trpc.live.listDiscovery.useQuery()`. Derives:
        - `allCategories`: deduplicated sorted list of all category names across the lives list, for rendering filter chips.
        - `filteredLives`: applies selected category filters (OR) and active sort to the lives list.
        - `selectedCategories`: `string[]` state (multi-select).
        - `sort`: `"name" | "date"` state, default `"date"`.
      - Returns `{ filteredLives, isLoading, allCategories, selectedCategories, setSelectedCategories, sort, setSort }`.
  - View (new file)
    - `app/client/src/pages/LivesPage/LivesPage.tsx`
      - Page header: back navigation + title "Lives".
      - Filter + sort bar (single row, scrollable horizontally if needed):
        - Left: category pill chips (multi-select, active = primary filled).
        - Right: two sort pill chips "Nom" | "Date" (single-select, active = primary filled, inactive = outlined).
      - Lives list: each card reuses the same structure as the home page live card (cover image or gradient, name, host nickname, "EN DIRECT" badge for active lives, start time for upcoming lives, participant count for active lives, "Rejoindre" / "Voir" button).
      - Loading state: 4 skeleton cards (same as home page).
      - Empty state: "Aucun live pour l'instant."
  - Routing
    - `app/client/src/App.tsx`
      - Import `LivesPage` and add: `<Route path="/lives" element={<ProtectedRoute><OnboardingGuard><LivesPage /></OnboardingGuard></ProtectedRoute>} />`

---

## Manual operations to configure services

None.
