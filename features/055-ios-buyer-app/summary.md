# iOS Buyer App (React Native / Expo)

## Initial Prompt

Build a buyer-only iOS app with React Native (Expo, free local workflow). Solo developer, no prior mobile experience. The web app (`app/`) validated the feature set — the real product is mobile-native. A previous attempt (`mobile-app/`) was abandoned: never ran on device, wrong API names (`channel.xxx` vs `live.xxx`), included seller flow, architecture issues. This is a fresh start.

**Success metric**: a buyer watches a live stream and completes a bid.

## Overview

Native iOS app for buyers, built with Expo (managed → bare after ticket-005) consuming the existing tRPC backend without any server-side changes. App lives at `ios-app/` at the repo root.

## Architecture

| Aspect | Decision |
|:-------|:---------|
| Framework | Expo SDK (managed until Agora forces bare) |
| Routing | Expo Router (file-based) |
| Project location | `ios-app/` at repo root |
| API client | `@trpc/react-query` + `@tanstack/react-query` v5 |
| Auth storage | `expo-secure-store` (encrypted) |
| Streaming (viewer) | `react-native-agora` |
| Payments | `@stripe/stripe-react-native` |
| Type sharing | `tsconfig.json` path alias `@server/*` → `../app/src` |

## User Stories

| User Story | Status |
|:-----------|:-------|
| As a buyer, I can create an account and log in | planned |
| As a buyer, I complete onboarding with a nickname | planned |
| As a buyer, I browse active and upcoming lives | planned |
| As a buyer, I watch a live stream (Agora video) | planned |
| As a buyer, I chat in real time during a live | planned |
| As a buyer, I see product highlights during a live | planned |
| As a buyer, I place a bid in an active auction | planned |
| As a buyer, I pay for a won order via Stripe | planned |
| As a buyer, I manage my profile and payment method | planned |

## Tickets

| Ticket | Description |
|:-------|:------------|
| ticket-001 | Project Bootstrap — Expo app + tRPC client + tab shell | ✅ |
| ticket-002 | Authentication — login, register, JWT persistence | ✅ |
| ticket-003 | Onboarding — nickname + avatar, onboarding guard | ✅ |
| ticket-004 | Home + Lives Discovery — live cards, category filters | ✅ |
| ticket-005 | Live Viewer (Agora) — video stream, dev build ✅ |
| ticket-006 | Chat + Live Events — real-time chat, product highlights ✅ |
| ticket-007 | Auction Bidding ⭐ — bid flow, requirements check, Stripe setup ✅ |
| ticket-008 | Orders + Stripe Payment — orders list, payment sheet ✅ |
| ticket-009 | Profile — name, payment method, logout |

## Out of Scope (v1)

- Seller flow (hosting lives, managing products, shop)
- Push notifications
- Mondial Relay address picker (delivery address)
- Android
