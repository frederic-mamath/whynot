# ticket-001 — Project Bootstrap

## Acceptance Criteria

- As a developer, when I run `npx expo start` in `ios-app/`, I should see the app launch in the iOS Simulator with 4 placeholder tabs (Home, Lives, Orders, Profile)
- As a developer, when I call any tRPC query from a screen, it should reach the production backend and return data

## Technical Strategy

- Frontend
  - `ios-app/` (new directory at repo root)
    - `npx create-expo-app ios-app --template tabs`: scaffold with Expo Router
    - `package.json`: add `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `expo-secure-store`, `expo-constants`
    - `tsconfig.json`
      - `compilerOptions.paths`: `"@server/*": ["../app/src/*"]` — shares AppRouter type with backend
      - `compilerOptions.paths`: `"@/*": ["./src/*"]` — local alias
    - `app.config.ts`
      - `extra.apiUrl`: `"https://whynot-app.onrender.com"` (prod default)
      - `extra.wsUrl`: `"wss://whynot-app.onrender.com"` (prod default)
    - `src/lib/auth.ts`: copy from `mobile-app/src/lib/auth.ts` — `expo-secure-store` JWT helpers
    - `src/lib/config.ts`: copy from `mobile-app/src/lib/config.ts` — reads `extra.apiUrl` / `extra.wsUrl`
    - `src/lib/trpc.ts`
      - `createTRPCReact<AppRouter>()` — typed with backend router
      - `splitLink`: HTTP batch for queries/mutations, WS link for subscriptions
      - Auth header: `Authorization: Bearer <token>` from `getToken()`
    - `src/lib/queryClient.ts`: `new QueryClient()` singleton
    - `src/providers/TRPCProvider.tsx`: wraps children with `trpc.Provider` + `QueryClientProvider`
    - `app/_layout.tsx`: root layout — wraps with `TRPCProvider`
    - `app/(tabs)/_layout.tsx`: `Tabs` with 4 tabs (Home, Lives, Orders, Profile)
    - `app/(tabs)/index.tsx`: placeholder — "Home (coming soon)"
    - `app/(tabs)/lives.tsx`: placeholder — "Lives (coming soon)"
    - `app/(tabs)/orders.tsx`: placeholder — "Orders (coming soon)"
    - `app/(tabs)/profile.tsx`: placeholder — calls `trpc.live.list.useQuery()` to verify tRPC works; displays count

## Manual Operations

- None — production backend already deployed at `https://whynot-app.onrender.com`
- To develop against local backend: set `extra.apiUrl` to `http://<your-local-ip>:3000` in `app.config.ts`
