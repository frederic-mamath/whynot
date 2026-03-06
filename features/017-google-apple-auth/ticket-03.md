# Ticket 03 — Frontend: JWT → Sessions migration

### Acceptance Criteria

- As a user, when I log in or register on the web app, the authentication is maintained via an httpOnly cookie (not a JWT in localStorage)
- As a developer, tRPC HTTP requests include `credentials: 'include'` so the session cookie is sent automatically
- As a developer, the NavBar and protected pages derive authenticated state from the `auth.me` query (not from `isAuthenticated()` / localStorage)
- As a developer, the JWT token in localStorage is kept purely as a fallback for mobile / WebSocket compatibility

### Technical Strategy

- Frontend
  - `app/client/src/App.tsx`
    - Remove `getToken` import
    - Replace Authorization header injection with `credentials: 'include'` on `httpBatchLink`
  - `app/client/src/lib/trpc.ts`
    - Remove token from WebSocket URL query param (cookie is sent in WS handshake)
  - `app/client/src/lib/auth.ts`
    - Keep `getToken` / `setToken` / `removeToken` / `isAuthenticated` for backward compatibility (mobile)
    - Add comments explaining the legacy role of these helpers
  - `app/client/src/pages/DashboardPage.tsx`
    - Derive `authenticated` from `auth.me` query error instead of `isAuthenticated()`
    - Use `trpc.auth.logout.useMutation()` to destroy server session on sign-out
  - `app/client/src/components/NavBar/NavBar.tsx`
    - Consolidate to a single `auth.me` query
    - Derive `authenticated` from `!!user` (query result)
    - Use `trpc.auth.logout.useMutation()` with cache invalidation on logout

### Manual operations to configure services

- None
