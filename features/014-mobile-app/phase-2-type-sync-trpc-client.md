# Phase 2: Type Sync & tRPC Client

## Objective

Create the type sync script to copy backend types into the mobile app, and configure the tRPC client with HTTP + WebSocket links to consume the existing backend API.

## User-Facing Changes

No user-facing changes — this is API infrastructure. After this phase, the mobile app can make authenticated tRPC calls to the backend.

## Files to Update

### Frontend (mobile-app/)

- `scripts/sync-types.sh` — Shell script to copy types from `app/src/`
- `src/types/server/` — Copied type files (AppRouter, DTOs, context)
- `src/lib/trpc.ts` — tRPC client with splitLink (HTTP + WS)
- `src/lib/queryClient.ts` — TanStack Query client instance
- `src/providers/TRPCProvider.tsx` — React provider wrapping tRPC + QueryClient
- `package.json` — Add `@trpc/client`, `@tanstack/react-query`, `superjson`

### Backend

- None

## Steps

1. Create `scripts/sync-types.sh` that copies `AppRouter` type, DTOs, and context types
2. Run the script to populate `src/types/server/`
3. Install `@trpc/client`, `@tanstack/react-query` v5, `superjson`
4. Create tRPC client with `splitLink` — `httpBatchLink` for queries/mutations, `wsLink` for subscriptions
5. Configure `Authorization: Bearer` header injection from secure store
6. Configure WebSocket with `?token=` query param
7. Create `QueryClient` instance
8. Create `TRPCProvider` component that wraps the app

## Acceptance Criteria

- [ ] `sync-types.sh` runs successfully and copies types to `src/types/server/`
- [ ] TypeScript compiles with imported `AppRouter` type
- [ ] tRPC client connects to local backend (`http://<IP>:3000/trpc`)
- [ ] A test query (e.g., `auth.me`) returns data or expected error
- [ ] WebSocket link configured for subscriptions

## Status

📝 PLANNING
