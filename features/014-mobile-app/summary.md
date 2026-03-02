# Mobile App (React Native / Expo) - Summary

## Overview

Native Android and iOS application for the WhyNot live commerce platform, built with Expo (managed workflow) and consuming the existing tRPC backend without server-side modifications.

## User Story

As a **buyer**, I want to browse live channels, watch streams, chat, bid in auctions, and pay for orders from a native mobile app so that I get a smooth, native experience.

As a **seller**, I want to manage my shop, create products (with camera photos), host live streams, highlight products, and launch auctions from my phone so that I can run my business on the go.

## Business Goal

- Reach mobile users who expect a native app experience for live commerce
- Leverage native device capabilities (camera streaming, push notifications, secure storage)
- Support both viewer and host roles from a single mobile app
- Maintain a single backend — the mobile app is a pure API consumer
- Distribute via App Store and Google Play for discoverability

## Progress Tracking

| Phase    | Description                            | Status |
| -------- | -------------------------------------- | ------ |
| Phase 1  | Project Initialization & Configuration | ✅     |
| Phase 2  | Type Sync & tRPC Client                | ✅     |
| Phase 3  | Authentication System                  | ✅     |
| Phase 4  | Navigation & App Shell                 | ✅     |
| Phase 5  | Buyer Core Screens                     | ✅     |
| Phase 6  | Live Viewer (Video + Chat)             | ✅     |
| Phase 7  | Live Viewer (Auctions)                 | ✅     |
| Phase 8  | Seller: Shop & Product Management      | ✅     |
| Phase 9  | Seller: Live Hosting                   | ✅     |
| Phase 10 | Orders & Stripe Payments               | ✅     |
| Phase 11 | Polish, Error Handling & Verification  | ✅     |

## UI/UX Components

### ⏳ Remaining

**Shared**

- LoadingScreen, EmptyState, ErrorBoundary, TabBarIcon

**Buyer**

- ChannelCard, OrderCard, ChatPanel, MessageInput, MessageList
- HighlightedProduct, AuctionWidget, BidInput, AuctionEndModal, AuctionCountdown

**Seller**

- ShopCard, ProductCard, ImageUploader (RN), ChannelControls
- ProductManagementPanel, AuctionConfigModal

**Live**

- Agora viewer (RtcSurfaceView), Agora host (local camera view)
- LIVE badge, ViewerCount, NetworkQuality indicator

## API/Backend Changes

**None.** The mobile app consumes the existing backend as-is:

- tRPC API at `https://whynot-app.onrender.com/trpc` (prod) / `http://<local-ip>:3000/trpc` (dev)
- WebSocket for chat subscriptions and channel events
- JWT auth via `Authorization: Bearer` header
- Agora token generation via `channel.generateAgoraToken`
- Stripe payment intents via `order.createPaymentIntent`
- Cloudinary image uploads via `image.upload` (base64)

## Architecture Decisions

See [ADR-001: Mobile App Technology Stack](../../docs/architecture-decision-records/001-mobile-app-technology-stack.md)

| Aspect           | Decision                                             |
| ---------------- | ---------------------------------------------------- |
| Framework        | Expo SDK 52+ (managed workflow)                      |
| Dev builds       | Expo Dev Client (Agora + Stripe need native modules) |
| Routing          | Expo Router (file-based)                             |
| Project location | `mobile-app/` at repo root (independent from `app/`) |
| API client       | `@trpc/client` + `@tanstack/react-query` v5          |
| Auth storage     | `expo-secure-store`                                  |
| Streaming        | `react-native-agora`                                 |
| Payments         | `@stripe/stripe-react-native`                        |
| UI styling       | NativeWind (Tailwind CSS for RN)                     |
| Type sharing     | Copy script (`scripts/sync-types.sh`)                |
| App ID           | `fr.mamath.whynot`                                   |

## Testing Plan

- Manual testing on Dev Client (Android physical device)
- Flow tests: auth → browse → join live → bid → pay → check orders
- Seller flow: create shop → add products → go live → highlight → auction
- Edge cases: network loss, permission denial, token expiry, empty states

## Success Metrics

- App builds and runs on Android and iOS Dev Client
- All tRPC endpoints accessible from mobile
- Live video streaming works (viewer + host)
- Real-time chat and auction events work
- Stripe payment flow completes successfully

## Status

⏳ IN PROGRESS
