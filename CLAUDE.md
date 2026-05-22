# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sub-directories have their own CLAUDE.md files with focused context:
- `app/CLAUDE.md` — commands, stack, directory tree
- `app/client/CLAUDE.md` — frontend patterns (React, tRPC client, styling)
- `app/src/CLAUDE.md` — backend patterns (tRPC routers, repositories, Kysely)

## Architecture Tests

Six structural rules are enforced automatically. Breaking any rule in a new file fails the build.

| Rule | Tool | Config |
|:-----|:-----|:-------|
| R1 — Routers cannot import `src/db/` directly | dep-cruiser | `app/.dependency-cruiser.cjs` |
| R2 — `pages/**/*.tsx` cannot use tRPC/useState/useEffect | regex | `scripts/arch-test.mjs` |
| R3 — Web client cannot use raw Tailwind color classes | regex | `scripts/arch-test.mjs` |
| R4 — Mobile screens cannot contain hex color codes | regex | `scripts/arch-test.mjs` |
| R5 — Repository classes imported only via `repositories/index.ts` | dep-cruiser | `app/.dependency-cruiser.cjs` |
| R6 — Only `client/src/lib/trpc.ts` may import `@trpc/client` | dep-cruiser | `app/.dependency-cruiser.cjs` |

Run all checks: `npm run arch:test` from `app/` (or `ios-app/` for R4 only).

## Feature Planning

Features are tracked in `features/` with numbered folders. See `features/CLAUDE.md` for the feature-ticketing protocol (atomic daily-deliverable tickets, app must build at every step).

## Project Purpose

**WhyNot** (branded **"Popup"**) is a **live-streaming commerce platform** for the French market. Sellers broadcast live video shows during which they present products, run real-time auctions, and take instant orders. Buyers watch live streams, place bids, and purchase items — all in real time without leaving the app. The core value proposition: selling in minutes instead of days, with engagement and conversion rates that outperform traditional marketplaces.

## User Types

| Role | How obtained | Capabilities |
|------|-------------|--------------|
| **BUYER** | Default for all authenticated users | Browse the live feed, watch streams, bid on auctions, buy products at fixed price, pay via Stripe, track deliveries in Activity tab |
| **SELLER** | Activated after completing a 10-step onboarding survey | Create a shop, list products, schedule and host live shows (Agora RTC), configure real-time auctions, receive payouts via Stripe Connect |

## User Flows

**Auth Flow**
WelcomePage → sign up (email / Google / Apple) or log in → `OnboardingPage` (first-time profile setup: nickname, avatar) → Home

**Buyer Flow**
Home (live feed) → tap a live → watch stream → bid on auction OR buy at fixed price → Stripe checkout → track order in Activity tab (`/my-orders`)

**Seller Flow**
`/vendre` → `SellerUpsellPage` → `/seller-onboarding` (10-step survey: category, type, revenue, address …) → SELLER role activated immediately → `/seller/shop` → add products via FAB → `SellerLivesPage` → schedule a live → go live (Agora RTC) → present + auction products in real time → payout via Stripe Connect

**Live / Auction Flow**
Seller starts a live → buyers join → seller creates an auction for a product (sets starting price, duration) → buyers bid via WebSocket → auction ends → highest bidder wins → Stripe checkout triggered for winner → seller ships → delivery confirmed
