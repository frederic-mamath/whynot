# Ticket 001 — Home page: limit active lives to 4, apply 3h staleness rule, "Voir tout" button

## Acceptance Criteria

- As a buyer, on the home page, I should see at most 4 lives in the "En direct maintenant" section.
- As a buyer, on the home page, lives that started more than 3 hours ago should not appear (considered stale/inactive).
- As a buyer, on the home page, when fewer than 5 active lives exist, I should not see a "Voir tout" button in the "En direct maintenant" section.
- As a buyer, on the home page, when 5 or more active lives exist, I should see a "Voir tout →" button that navigates me to `/lives`.

---

## Technical Strategy

- **Backend**
  - Router
    - `app/src/routers/live.ts`
      - `list`: Add optional `input` with `limit?: number`. Apply two changes to the existing query:
        1. Add staleness filter: `eb("lives.starts_at", ">=", sql`now() - interval '3 hours'`)`.
        2. Change ordering from `lives.created_at DESC` to `lives.starts_at DESC`.
        3. When `limit` is provided, query `limit + 1` rows. If result length exceeds `limit`, slice to `limit` and return `{ lives, hasMore: true }`, otherwise `{ lives, hasMore: false }`.
        4. When no `limit` is provided (existing callers), return the array directly as before to avoid breaking changes.

- **Frontend**
  - Hook
    - `app/client/src/pages/HomePage.hooks.ts`
      - `useHomePage`: Pass `{ limit: 4 }` to `trpc.live.list.useQuery({ limit: 4 })`. Expose `activeLives` (from `data.lives`) and `hasMoreLives` (from `data.hasMore`).
  - View
    - `app/client/src/pages/HomePage.tsx`
      - Update the destructured `activeLives` and `isActiveLivesLoading` to also consume `hasMoreLives`.
      - In the "En direct maintenant" header row, conditionally render a `<Link to="/lives">` "Voir tout →" button (same styling as the sellers section) only when `hasMoreLives === true`.

---

## Manual operations to configure services

None.
