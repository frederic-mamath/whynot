# React Native iOS — Application Architecture

This document describes the **application architecture layers** of the iOS app — the equivalent of the backend's controllers / services / repositories / configurations. The goal is to give a contributor (human or AI) a clear mental map of *where each kind of code belongs*.

For the runtime engine layers (TypeScript → Metro → Hermes → JSI → Swift), see `react-native-ios-deployment.md`.

---

## Layer overview

| Backend layer (web)              | iOS equivalent                            | Lives in                                 |
| :------------------------------- | :---------------------------------------- | :--------------------------------------- |
| Routers / controllers            | Screens via expo-router file-based routing | `ios-app/app/`                          |
| Preauthorizations / middleware   | Auth-gated route groups + `AuthContext`   | `ios-app/app/(auth)`, `ios-app/app/(tabs)`, `ios-app/src/contexts/AuthContext.tsx` |
| Services / business logic        | Screen-local hooks + reusable hooks        | Inline in screens, or `ios-app/src/lib/` |
| Repositories / DB access         | tRPC client — typed against the backend   | `ios-app/src/lib/trpc.ts`                |
| Configurations                   | `app.config.ts`, `eas.json`, env vars     | `ios-app/app.config.ts`, `ios-app/eas.json`, `.env*` |
| *(no equivalent)*                | Native modules (Swift bridges)            | `ios-app/modules/`                       |

The iOS app has one extra layer the backend doesn't: **native modules**, which expose iOS-only capabilities (camera, Apple Pay, Agora video) to the JavaScript layer.

---

## Layer 1 — Routing (≈ controllers)

The iOS app uses **expo-router**, a file-based routing system inspired by Next.js. Every file in `ios-app/app/` becomes a route. There are no `<Route>` components to register — the file system *is* the routing table.

```
app/
├── _layout.tsx          # Root stack — wraps every screen with providers (Stripe, tRPC, Auth, theme)
├── (auth)/              # Route group — parentheses do NOT appear in the URL
│   ├── _layout.tsx      # Layout shared by welcome/login/register
│   ├── welcome.tsx      # → /welcome
│   ├── login.tsx        # → /login
│   └── register.tsx     # → /register
├── (tabs)/              # Tab navigator
│   ├── _layout.tsx      # Defines the tab bar
│   ├── index.tsx        # → / (Home)
│   ├── lives.tsx        # → /lives
│   ├── orders.tsx       # → /orders
│   └── profile.tsx      # → /profile
├── live/[liveId].tsx    # → /live/123 (dynamic segment)
└── onboarding.tsx       # → /onboarding
```

Each screen file plays the role a controller plays on the backend: it owns one route, decides what data it needs, and renders the response (UI rather than JSON). Navigation between screens is done with `router.push("/live/123")` from `expo-router`.

---

## Layer 2 — Preauthorization (≈ middleware / `protectedProcedure`)

The backend gates routes with `protectedProcedure` (throws `UNAUTHORIZED` if `ctx.user` is missing). The iOS equivalent operates at two levels:

**Route group level** — the parenthesized folders `(auth)` and `(tabs)` are conventions for two logical zones:
- `(auth)` contains screens for users who are **not yet logged in**
- `(tabs)` contains screens that require **a valid auth token**

The root `_layout.tsx` reads the auth state from `AuthContext` and redirects to the appropriate group on app launch.

**Component level** — within an authenticated screen, additional checks (e.g. "user must have completed onboarding before accessing the home tab") happen via conditional rendering or programmatic `router.replace()` calls.

The single source of truth for auth state is `src/contexts/AuthContext.tsx`. It exposes the current user, the JWT token, and `login` / `logout` functions. The JWT is persisted in `expo-secure-store` (encrypted Keychain on iOS) so it survives app restarts.

---

## Layer 3 — Business logic (≈ services)

The backend separates business logic from controllers into `src/services/`. The iOS app intentionally does **not** enforce a parallel split — screen components are allowed to contain hooks, state, side-effects, and tRPC calls inline.

Rationale: React Native screens are smaller in scope than web pages, and the extra indirection of a `.hooks.ts` file (used on the web) adds friction without payoff on mobile. The web rule "no tRPC in `.tsx` files" does **not** apply to iOS.

When logic is reused across screens, it is extracted into:
- `src/lib/` for pure utilities (e.g. `auth.ts`, `agora.ts`)
- A custom hook colocated with the consuming screen, or `src/components/<feature>/` for components with shared state

---

## Layer 4 — Data access (≈ repositories)

All backend communication goes through a single tRPC client at `src/lib/trpc.ts`. This client is typed against the backend's `appRouter` — calling `trpc.profile.me.useQuery()` from iOS produces the exact same result shape the backend returns, with full TypeScript autocomplete.

The mental model: tRPC plays the role on iOS that repositories play on the backend — a single typed boundary between the application layer and the persistence layer (which, from iOS's perspective, is the backend API).

Rules:
- **Never call `fetch` directly.** Adding a new endpoint means adding a tRPC procedure on the backend, not a raw HTTP call.
- Mutations use TanStack Query under the hood — invalidate the right query keys on success to keep the UI in sync.
- JWT authentication is attached automatically by the tRPC client config, reading from the same `expo-secure-store` as `AuthContext`.

---

## Layer 5 — Configuration

Configuration on iOS spans three files and two execution contexts (build time vs runtime).

**`app.config.ts`** — the Expo manifest. Controls anything that affects the **native binary**:
- App name, version, bundle identifier
- Plugins (Stripe, expo-router, expo-secure-store) — each plugin runs at `prebuild` time and edits native files (`Info.plist`, `.entitlements`, `AppDelegate`)
- Permissions strings (`NSCameraUsageDescription`, etc.)
- `extra.*` — runtime config exposed to JS via `expo-constants`

Anything that changes here requires `npx expo prebuild --clean` and a **new binary** (see deployment doc).

**`eas.json`** — EAS Build + Update profiles. Defines channels (`production`) and build profiles. Changes here do not require a new binary; they affect the next `eas update` or `eas build` invocation.

**`.env*` files** — `EXPO_PUBLIC_*` variables are inlined at build time (Metro statically replaces `process.env.EXPO_PUBLIC_FOO` with the literal value when bundling). They are not secret — they are visible in the shipped JS bundle. Treat them as build-time constants, not runtime config.

---

## Layer 6 — Native modules (iOS-only, no backend equivalent)

When the JavaScript layer cannot accomplish something (low-level video rendering, deep iOS API access, performance-critical paths), a native module bridges Swift/ObjC code to JS. The project has one custom module:

```
modules/agora-viewer/
├── expo-module.config.json    # Declares the module to Expo
├── agora-viewer.podspec       # CocoaPods spec — pulled in by `pod install`
├── ios/                       # Swift implementation (subscriber view for Agora RTC)
├── src/                       # TS bindings — what JS imports
└── package.json
```

The TS side imports from `modules/agora-viewer/src/` and gets a typed React component (`<AgoraViewer remoteUid={...} />`). The Swift side renders the actual video frames via Agora's iOS SDK.

This pattern is preferred over patching `ios/` directly because:
- `ios/` is regenerated by `npx expo prebuild --clean` — hand-edits are wiped
- A modular package can be extracted, versioned, and reused later

---

## How a change flows through the layers

A typical buyer-facing change (e.g. *"add a delivery address section to the profile"*) flows like this:

1. **Configuration** — usually nothing changes
2. **Data access** — the backend already exposes `trpc.profile.addresses.*`; iOS just consumes it
3. **Business logic** — local state for the form (`useState`), validation
4. **Routing** — new files: `app/address/index.tsx`, `app/address/new.tsx`
5. **Preauthorization** — placed under `(tabs)/` since it requires auth
6. **Native modules** — none required; pure JS feature

This change is shippable via OTA update — no new binary, no App Store review. See the deployment doc for which changes do require a new binary.

---

## Quick decision guide

| Question | Answer |
| :--- | :--- |
| Where do I add a new screen? | New file in `ios-app/app/` |
| Where do I add a new API endpoint? | On the backend (`app/src/routers/`) — iOS auto-discovers via tRPC types |
| Where do I add a shared utility? | `ios-app/src/lib/` |
| Where do I add a shared component? | `ios-app/src/components/` |
| Where do I store an auth token? | Always through `AuthContext` (which uses `expo-secure-store`) |
| Where do I add an environment variable? | `app.config.ts > extra` for static config, `EXPO_PUBLIC_*` in `.env*` for build-time injection |
| Where do I add a native iOS capability? | New module in `ios-app/modules/<name>/` — never edit `ios/` directly |
