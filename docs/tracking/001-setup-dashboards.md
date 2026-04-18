# 001 — PostHog Dashboard Setup

**Date**: 2026-04-17
**Status**: Dashboard 1 configured. Dashboards 2 & 3 pending.

---

## Context

WhyNot/Popup had PostHog installed but no events and no dashboards. As part of the first analytics milestone, we:

1. Audited the codebase and produced a canonical tracking plan (`features/tracking-plan.md`)
2. Implemented 25 PostHog events across all four product funnels
3. Fixed the production Dockerfile so `VITE_POSTHOG_KEY` is baked into the Vite bundle at build time
4. Designed three dashboards covering acquisition, buyer revenue, and seller supply

This document records the dashboard configuration so it can be reproduced if the PostHog project is reset or migrated.

---

## Infrastructure

| Setting | Value |
|---------|-------|
| PostHog region | EU (`eu.i.posthog.com`) |
| Init file | `app/client/src/main.tsx` |
| Key env var | `VITE_POSTHOG_KEY` (build-time, injected via Docker `--build-arg`) |
| Host env var | `VITE_POSTHOG_HOST` (defaults to `https://eu.i.posthog.com`) |
| Auto-capture | `$pageview` and `$pageleave` enabled |

---

## Event reference

See [`features/tracking-plan.md`](../../features/tracking-plan.md) for the full list of events, their properties, status, and the file where each is implemented.

Quick status as of this document:

| Funnel | Implemented | Remaining |
|--------|-------------|-----------|
| Auth & Onboarding | `sign_up_started`, `sign_up_completed`, `login_completed`, `onboarding_completed`, `user_identified` | `login_started` |
| Buyer Journey | `live_joined`, `live_left`, `seller_followed`, `bid_requirements_modal_shown`, `order_pay_initiated`, `order_paid` | `auction_won` (needs WebSocket subscription) |
| Seller Journey | `seller_onboarding_step_completed`, `seller_onboarding_submitted`, `product_created`, `live_scheduled`, `delivery_label_generated`, `payout_requested` | — |
| Live & Auction | `live_started`, `live_ended`, `product_highlighted`, `auction_started`, `auction_closed`, `bid_placed`, `auction_bought_out` | `auction_won` |

---

## Dashboard 1 — Acquisition & Activation ✅

**Business question**: Are new users reaching their first meaningful action?

### Insight 1 — Sign-up funnel

| Field | Value |
|-------|-------|
| Type | Funnel |
| Step 1 | `sign_up_started` |
| Step 2 | `sign_up_completed` |
| Step 3 | `onboarding_completed` |
| Conversion window | 14 days |
| Name | `Sign-up funnel` |

What to watch: drop between `sign_up_completed` and `onboarding_completed` — users who register but never finish profile setup.

### Insight 2 — Daily new signups

| Field | Value |
|-------|-------|
| Type | Trends |
| Series A | `sign_up_completed` |
| Interval | Day |
| Date range | Last 30 days |
| Chart type | Line |
| Name | `Daily new signups` |

### Insight 3 — Seller onboarding drop-off

| Field | Value |
|-------|-------|
| Type | Funnel |
| Steps | `seller_onboarding_step_completed` × 10, each filtered by `step_name` property |
| Step filters | `rules` → `category` → `sub_category` → `seller_type` → `selling_channels` → `monthly_revenue` → `item_count` → `team_size` → `live_hours` → `return_address` |
| Conversion window | 30 days |
| Name | `Seller onboarding drop-off` |

What to watch: the step with the biggest drop — typically `return_address` (step 9) due to friction.

### Insight 4 — Signups vs seller activations

| Field | Value |
|-------|-------|
| Type | Trends |
| Series A | `sign_up_completed` |
| Series B | `seller_onboarding_submitted` |
| Interval | Week |
| Chart type | Line |
| Formula (optional) | `B/A * 100` for seller conversion % as a single line |
| Name | `Signups vs seller activations` |

### Layout

```
┌────────────────────────┬──────────────────────┐
│   Sign-up funnel       │  Daily new signups   │
│   (wide)               │                      │
├────────────────────────┴──────────────────────┤
│   Seller onboarding drop-off (full width)     │
├────────────────────────┬──────────────────────┤
│   Signups vs seller    │                      │
│   activations          │                      │
└────────────────────────┴──────────────────────┘
```

---

## Dashboard 2 — Buyer Engagement & Revenue (pending)

**Business question**: Are buyers watching, bidding, and paying?

Planned insights:
- Buyer purchase funnel: `live_joined` → `bid_placed` → `order_paid`
- Bids per live (grouped by `live_id`)
- Average watch duration (`live_left` → avg `watch_duration_seconds`)
- Bid requirements friction (`bid_requirements_modal_shown` broken down by `missing`)
- Order payment trend (`order_paid` daily)

---

## Dashboard 3 — Seller Supply Health (pending)

**Business question**: Are sellers creating content and going live?

Planned insights:
- Seller activation funnel: `seller_onboarding_submitted` → `product_created` → `live_scheduled` → `live_started` → `auction_started`
- Products created per week
- Lives scheduled vs started (same chart, two series)
- Auction conversion: `auction_started` → `bid_placed` → `auction_closed`

---

## Recommended PostHog features to enable

| Feature | Why |
|---------|-----|
| **Session Replay** | Filter to `/lives/*` URL — watch sessions where `bid_requirements_modal_shown` fired to understand buyer friction |
| **Cohorts** | "Active Buyer" = `bid_placed` ≥1 in last 30 days. "Active Seller" = `live_started` ≥1 in last 30 days. Use to filter all dashboards |
| **Feature Flags** | When A/B testing bid UX or auction duration, flags + existing events give free variant analysis with no extra instrumentation |

---

## The one metric to watch

The gap between `live_joined` and `bid_placed` is the core product health indicator. A high drop-off here means buyers are watching but not engaging. Session replay on those sessions + the `bid_requirements_modal_shown` breakdown will explain why.
