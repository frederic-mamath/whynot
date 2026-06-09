// Tiny event bus for "log this session out" signals.
//
// The tRPC unauthorized link (in `trpc.ts`) calls `requestLogout()` when the
// server returns 401 / UNAUTHORIZED. `AuthContext` subscribes via
// `onLogoutRequested(...)` and triggers its own `logout()`.
//
// A separate module avoids a circular dependency between `trpc.ts` and
// `AuthContext.tsx`.

type Handler = () => void;
const handlers = new Set<Handler>();

export function onLogoutRequested(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function requestLogout(): void {
  for (const handler of handlers) {
    handler();
  }
}
