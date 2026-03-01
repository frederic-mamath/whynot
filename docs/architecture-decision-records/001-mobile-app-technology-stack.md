# ADR-001: Mobile App Technology Stack

**Status:** accepted

**Date:** 2026-03-01

## Context

WhyNot is a live commerce platform currently available as a web application built with React 19 + Vite (frontend) and Express + tRPC + PostgreSQL (backend). The platform enables sellers to host live video streams where buyers can watch, chat in real time, browse products, place bids in auctions, and purchase items via Stripe.

The backend exposes:

- **tRPC API** on `/trpc` (HTTP adapter) with 12 routers: `auth`, `channel`, `shop`, `product`, `vendorPromotion`, `role`, `message`, `auction`, `order`, `payout`, `profile`, `image`
- **WebSocket** for real-time features: tRPC subscriptions (chat messages) and raw broadcast (auction events, product highlights, user join/leave)
- **JWT authentication** (7-day tokens, `Authorization: Bearer` header for HTTP, `?token=` query param for WebSocket)
- **Agora RTC** token generation for live video streaming
- **Stripe** payment processing (payment intents, webhooks)
- **Cloudinary** signed image uploads (base64)

We need native Android and iOS applications to:

1. Reach mobile users who expect a native app experience for live commerce
2. Leverage native device capabilities (camera for streaming, push notifications)
3. Support **both** viewer and host roles — sellers should be able to stream live from their phone

The mobile app must consume the existing backend **without modifications** to the server.

## Decision

### Framework: Expo (managed workflow)

We will use **Expo SDK 52+** with the managed workflow. Expo provides:

- Simplified setup and configuration
- Over-the-air (OTA) updates via EAS Update for quick bug fixes
- A large ecosystem of maintained packages with Config Plugins
- Unified build pipeline via EAS Build for both platforms

### Development builds: Expo Dev Client

Since the app requires native modules that are **not available in Expo Go** (specifically `react-native-agora` and `@stripe/stripe-react-native`), we will use **Expo Dev Client** for development. This means:

- Custom development builds compiled via `eas build --profile development` or locally via `npx expo run:ios` / `npx expo run:android`
- Testing on physical devices and emulators via the custom dev client (not Expo Go)
- EAS Build for CI/CD

### Routing: Expo Router

We will use **Expo Router** for navigation. It provides:

- File-based routing (consistent with modern conventions)
- Built-in deep linking support
- Type-safe routes
- Layout routes for shared UI (tab bars, headers)

### Project structure

The mobile app will live in a **standalone directory** at the root of the repository:

```
whynot/
├── app/                  # Existing web app (backend + frontend)
├── mobile-app/           # New React Native app
│   ├── app/              # Expo Router pages
│   ├── src/
│   │   ├── components/   # RN components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # tRPC client, auth helpers
│   │   ├── types/
│   │   │   └── server/   # Copied types from backend
│   │   └── utils/
│   ├── scripts/
│   │   └── sync-types.sh # Type sync script
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── docs/
└── ...
```

The `mobile-app/` directory is **fully independent** from `app/` — it has its own `package.json`, `tsconfig.json`, and build configuration. No npm workspaces or monorepo tooling is introduced.

### API client: tRPC + TanStack Query

- `@trpc/client` with `@tanstack/react-query` v5 for data fetching
- The tRPC client will point to the **absolute backend URL** (e.g., `https://api.whynot.mamath.fr/trpc`) — unlike the web frontend which uses relative paths
- `httpBatchLink` for queries/mutations, `wsLink` for subscriptions (chat)
- A separate raw WebSocket connection for channel broadcast events (auctions, highlights)

### Authentication: JWT + expo-secure-store

- JWT tokens stored in **`expo-secure-store`** (encrypted storage on device) — replacing `localStorage` used by the web app
- Transmitted via `Authorization: Bearer <token>` header (same as web)
- WebSocket auth via `?token=<jwt>` query parameter (same as web)
- No server-side changes required

### Live streaming: react-native-agora

- **`react-native-agora`** (Agora's official React Native SDK) replaces `agora-rtc-sdk-ng` (web-only)
- Expo Config Plugin for camera and microphone permissions
- Host role: `ClientRoleType.ClientRoleBroadcaster` — publish camera + mic tracks
- Viewer role: `ClientRoleType.ClientRoleAudience` — subscribe to remote streams
- Token generation reuses the existing `channel.generateAgoraToken` tRPC endpoint

> ⚠️ The Agora API for React Native differs significantly from the web SDK. Streaming components (camera views, controls) must be **rewritten entirely** — no code sharing with the web frontend.

### Payments: @stripe/stripe-react-native

- **`@stripe/stripe-react-native`** with Expo Config Plugin
- PaymentSheet or custom card input for checkout flows
- Reuses existing backend Stripe endpoints (`order.createPaymentIntent`, existing webhooks)

### Image upload

- The existing backend accepts **base64-encoded images** via `image.upload` tRPC mutation
- On mobile, use `expo-image-picker` to capture photos or select from gallery
- Convert to base64 and call the same mutation — no backend changes needed

### Type sharing: Copy/codegen script

A shell script `mobile-app/scripts/sync-types.sh` will copy the relevant type files from the backend:

- `AppRouter` type from `app/src/routers/index.ts`
- Shared types from `app/src/types/`
- DB types if needed for inference

This approach is chosen over npm workspaces to keep the two projects **decoupled** and avoid complicating the CI/CD pipeline. The script is run manually or as a pre-build step.

### UI framework

- Native React Native components as the base
- **react-native-unistyles v3** for styling — enhanced `StyleSheet.create()` with theme support, breakpoints, and TypeScript-first API. Design tokens (colors, spacing, radii) are extracted from the web app's CSS variables and registered as Unistyles themes (light + dark, following OS preference)
- Custom component library inspired by the existing Shadcn UI components, adapted for native

## Alternatives Considered

| Alternative                           | Pros                                                                 | Cons                                                                                                                 | Verdict                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Flutter**                           | Single codebase for both platforms, mature ecosystem, fast rendering | Different language (Dart) — no TypeScript sharing, can't import `AppRouter` types, team has no Dart experience       | **Rejected** — TypeScript type sharing is a key requirement                                        |
| **React Native CLI (vanilla)**        | Full native control from day 1, no Expo abstraction layer            | Complex setup (Xcode + Android Studio mandatory), no OTA updates, more boilerplate for permissions/builds            | **Rejected** — Expo provides the same native access via Dev Client with less friction              |
| **Expo bare workflow**                | Full native access + some Expo tooling                               | More complex than managed, manual native project maintenance                                                         | **Rejected** — Managed + Dev Client provides equivalent native access with simpler maintenance     |
| **PWA (Progressive Web App)**         | No separate codebase, reuse existing frontend entirely               | Limited camera/mic access on iOS, no push notifications (iOS 16+), poor streaming performance, no app store presence | **Rejected** — Live streaming and native device access are core requirements                       |
| **npm workspaces (for type sharing)** | Automatic type resolution, single `npm install`                      | Couples both projects, complicates CI/CD, risk of dependency conflicts, overkill for sharing a few type files        | **Rejected** — Simplicity wins; copy script is sufficient for now, can migrate to workspaces later |
| **React Navigation**                  | Mature, flexible, well-documented                                    | More verbose configuration, manual deep linking setup, not file-based                                                | **Rejected** — Expo Router provides a more modern DX with less boilerplate                         |

## Consequences

### Positive

- The existing backend requires **zero modifications** — the mobile app is a pure consumer
- JWT auth, base64 image uploads, and tRPC API work identically from mobile
- OTA updates via EAS Update allow quick bug fixes without App Store review
- Expo Router provides type-safe, file-based routing with built-in deep linking
- Unistyles v3 allows reusing the same design tokens from the web app with native StyleSheet semantics
- `mobile-app/` is fully decoupled — web app development is unaffected
- Same TypeScript language across the entire stack (backend, web, mobile)

### Negative

- **Two UI codebases** to maintain — Shadcn UI components (web) must be recreated as native components
- **Agora SDK is completely different** — `react-native-agora` has a different API from `agora-rtc-sdk-ng`, streaming pages must be rewritten
- **No Expo Go** — development requires custom builds (~5 min compile time for first build)
- **Type sync is manual** — forgetting to run the sync script after backend changes can cause runtime errors
- **App Store review** — iOS releases require Apple review (1-3 days), unlike instant web deploys

### Risks

- **Agora RN SDK stability** — `react-native-agora` may lag behind the web SDK in features or have platform-specific bugs. Mitigation: test extensively on both platforms early.
- **Expo SDK upgrades** — Major Expo SDK upgrades can introduce breaking changes. Mitigation: follow Expo's upgrade guide, pin SDK version.
- **Type drift** — Backend types may diverge from the copied types in `mobile-app/`. Mitigation: add a CI check that runs the sync script and fails if types differ.
- **Performance** — Live video streaming + real-time chat + auctions is resource-intensive on mobile. Mitigation: profile early, optimize re-renders, use `React.memo` and `useMemo` aggressively.
