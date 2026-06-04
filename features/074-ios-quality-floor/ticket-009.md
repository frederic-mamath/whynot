# Ticket 009 — tRPC 401 middleware + auth recovery

## Goal

Today's auth has no recovery path. If the JWT expires or rotates, the WebSocket and HTTP links keep using the stale token until the app cold-boots. The only logout path is `meQuery.isError` on initial mount in `AuthContext`.

Add a tRPC link that detects `UNAUTHORIZED`/401 responses, fires a logout event, and routes the user to `(auth)/welcome`. The WebSocket URL function reads the current token from `expo-secure-store` on every reconnect, so a fresh login takes effect without an app restart.

## Acceptance Criteria

- As a user, when my session expires (server invalidates token), the next tRPC call logs me out and routes me to the welcome screen
- As a user, after I re-log in, the new token is used by both HTTP and WebSocket immediately — no app restart required
- As a developer, the 401 detection lives in one place (the tRPC link), not scattered across screens
- As a developer, `cd ios-app && npx tsc --noEmit && npm run lint` passes

## Technical Strategy

- Frontend / Auth bus
  - `ios-app/src/lib/authBus.ts`
    - Thin pub/sub: `onLogoutRequested(handler) => unsubscribe`, `requestLogout()`
    - Trivial in-memory event emitter — avoids circular import between `trpc.ts` and `AuthContext.tsx`
- Frontend / tRPC link
  - `ios-app/src/lib/trpc.ts`
    - Add a custom `unauthorizedLink` wrapping the existing chain. On observable error, inspect `err.data?.httpStatus === 401` OR `err.data?.code === "UNAUTHORIZED"` → `authBus.requestLogout()`
    - WebSocket: confirm `url` is a function that reads `getAuthToken()` at connect time (it is per current code) — document with a comment
- Frontend / AuthContext
  - `ios-app/src/contexts/AuthContext.tsx`
    - On mount, subscribe to `authBus.onLogoutRequested(() => logout())`
    - Confirm `logout()` clears `expo-secure-store`, clears the tRPC query cache, and triggers re-render → `(auth)/welcome` redirect via existing root layout logic
- Frontend / Layout
  - `ios-app/app/_layout.tsx` — confirm the existing `user == null` → redirect-to-`welcome` branch fires; add a one-line comment documenting that 401 recovery flows through here

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run lint
```

Manual: log in. Invalidate the JWT server-side (or delete it from `expo-secure-store` via the React Native debugger). Trigger any tRPC call (pull to refresh) → user lands on welcome. Log back in → next call succeeds without app restart.

## Manual operations to configure services

None.
