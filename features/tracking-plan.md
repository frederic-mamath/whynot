# Tracking Plan — WhyNot / Popup

> **PostHog init** (`app/client/src/main.tsx`): `capture_pageview: true`, `capture_pageleave: true`
> Automatic events: `$pageview`, `$pageleave` fire on every route change — no code needed.

> ⚠️ **PII finding**: `waitlist_signup` in `LandingPage.tsx:138` captures `email` as a property. Remove it — use `posthog.identify()` instead or omit entirely.

---

## Landing Page (pre-auth)

All 4 existing events are on the public landing page only.

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `section_viewed` | Section scrolled into view (30% threshold) | `section_name` | **exists** | LandingPage.tsx:107 |
| `waitlist_signup` | Waitlist form submitted successfully | `role: buyer\|seller` ~~`email`~~ ✅ PII removed | **exists** | LandingPage.tsx:138 |
| `cta_click` | CTA button clicked | `section`, `label` | **exists** | LandingPage.tsx:154, :234 |
| `accordion_opened` | FAQ accordion item expanded | `question` | **exists** | LandingPage.tsx:422 |

---

## Funnel A — Auth & Onboarding

Zero events currently. This is the biggest blind spot — without it, you cannot measure acquisition or activation.

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `sign_up_started` | User lands on SignUpPage | — | **exists** | SignUpPage.tsx |
| `sign_up_completed` | `registerMutation.onSuccess` | `method: email` | **exists** | SignUpPage.tsx |
| `sign_up_failed` | `registerMutation.onError` | `error_code` | nice-to-have | SignUpPage.tsx |
| `login_started` | User lands on LoginPage | — | planned | LoginPage/LoginPage.hooks.ts |
| `login_completed` | `loginMutation.onSuccess` | `method: email` | **exists** | LoginPage/LoginPage.hooks.ts |
| `login_failed` | `loginMutation.onError` | — | nice-to-have | LoginPage/LoginPage.hooks.ts |
| `onboarding_completed` | `completeOnboarding.mutateAsync` resolves | `has_avatar: boolean` | **exists** | OnboardingPage.hooks.ts |
| `password_reset_requested` | Forgot-password form submitted | — | nice-to-have | ForgotPasswordPage.tsx |
| `password_reset_completed` | Reset form submitted successfully | — | nice-to-have | ResetPasswordPage/ |
| `user_identified` | After any successful login/signup | PostHog `identify()` with `role`, `created_at` | **exists** | LoginPage.hooks.ts + SignUpPage.tsx |

> **Note on `user_identified`**: this is a `posthog.identify(userId, { role, created_at })` call, not a `capture()`. It links all anonymous pre-auth events to the authenticated user. Must be called on every login/signup success.

---

## Funnel B — Buyer Journey

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `live_feed_viewed` | HomePage mounts and lives data loads | `active_lives_count`, `has_upcoming` | nice-to-have | HomePage.hooks.ts |
| `seller_followed` | `followSeller.mutate()` succeeds | `seller_id` | **exists** | HomePage.hooks.ts |
| `seller_unfollowed` | `unfollowSeller.mutate()` succeeds | `seller_id` | nice-to-have | HomePage.hooks.ts |
| `live_joined` | `joinMutation.onSuccess` in `useAgora` | `live_id`, `live_status: active\|upcoming`, `is_host: false` | **exists** | LiveDetailsPage.hooks.ts |
| `live_left` | `leaveMutation` called in `handleLeave` / `forceLeave` | `live_id`, `watch_duration_seconds` | **exists** | LiveDetailsPage.hooks.ts |
| `chat_message_sent` | `sendMessageMutation` succeeds | `live_id` | nice-to-have | LiveDetailsPage.hooks.ts |
| `product_highlighted_seen` | `PRODUCT_HIGHLIGHTED` WebSocket event received | `live_id`, `product_id`, `product_name` | nice-to-have | LiveDetailsPage.hooks.ts |
| `bid_requirements_modal_shown` | `PRECONDITION_FAILED` error on bid → modal opens | `live_id`, `missing: full_name\|payment\|address` | **exists** | LiveDetailsPage.hooks.ts |
| `order_pay_initiated` | `handlePayNow()` called in MyOrdersPage | `order_id`, `amount_cents` | **exists** | MyOrdersPage.hooks.ts |
| `order_paid` | `handlePaymentSuccess()` called OR `?payment_success=true` redirect | `order_id` | **exists** | MyOrdersPage.hooks.ts |
| `order_filter_changed` | `setFilter()` called | `filter: all\|pending\|paid\|shipped\|failed\|refunded` | nice-to-have | MyOrdersPage.hooks.ts |
| `shop_viewed` | ShopDetailsPage mounts | `shop_id`, `seller_id` | nice-to-have | ShopDetailsPage.tsx |

---

## Funnel C — Seller Journey

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `seller_upsell_viewed` | SellerUpsellPage mounts | — | nice-to-have | SellerUpsellPage.tsx |
| `seller_onboarding_step_completed` | Each `invalidateAndAnimate(stepIndex)` call | `step_index: 0–9`, `step_name` | **exists** | SellerOnboardingPage.hooks.ts |
| `seller_onboarding_submitted` | `submitApplicationMutation.onSuccess` | `category`, `seller_type: individual\|registered_business` | **exists** | SellerOnboardingPage.hooks.ts |
| `product_created` | `createProduct.mutateAsync` resolves | `shop_id`, `has_price: boolean`, `has_images: boolean`, `image_count` | **exists** | ProductCreatePage.hooks.ts |
| `product_updated` | Update mutation succeeds | `product_id`, `shop_id` | nice-to-have | ProductUpdatePage.tsx |
| `live_scheduled` | Create live dialog form submitted successfully | `live_id`, `days_until_start`, `has_cover: boolean`, `product_count` | **exists** | SellerLivesPage — ScheduleLiveDialog.tsx |
| `live_edited` | `handleEditSave()` succeeds | `live_id` | nice-to-have | SellerLivesPage.hooks.ts |
| `live_deleted` | `deleteMutation.onSuccess` | `live_id` | nice-to-have | SellerLivesPage.hooks.ts |
| `delivery_label_generated` | `generateLabel.onSuccess` | `package_id`, `weight_grams` | **exists** | SellerDeliveriesPage.hooks.ts |
| `payout_requested` | `requestPayouts.onSuccess` | `payout_count` | **exists** | SellerDeliveriesPage.hooks.ts |
| `delivery_status_refreshed` | `refreshStatus.onSuccess` | `package_id`, `new_status` | nice-to-have | SellerDeliveriesPage.hooks.ts |

---

## Funnel D — Live & Auction

> Note: `SellerGoPage` is a placeholder ("Bientôt disponible") — no events needed yet.
> Auction logic lives in `LiveDetailsPage.hooks.ts` (`useAuction`) and `app/src/routers/auction.ts`.

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `live_started` | Seller `joinMutation.onSuccess` with `isHost: true` + Agora publish succeeds | `live_id` | **exists** | LiveDetailsPage.hooks.ts |
| `live_ended` | Seller calls `handleLeave` | `live_id`, `duration_seconds` | **exists** | LiveDetailsPage.hooks.ts |
| `product_highlighted` | `highlightMutation.onSuccess` | `live_id`, `product_id` | **exists** | LiveDetailsPage.hooks.ts |
| `product_unhighlighted` | `unhighlightMutation.onSuccess` | `live_id`, `product_id` | nice-to-have | LiveDetailsPage.hooks.ts |
| `auction_started` | `startMutation.onSuccess` | `live_id`, `auction_id`, `product_id`, `starting_price_cents`, `duration_seconds`, `has_buyout: boolean` | **exists** | LiveDetailsPage.hooks.ts |
| `auction_closed` | `closeMutation.onSuccess` | `live_id`, `auction_id` | **exists** | LiveDetailsPage.hooks.ts |
| `bid_placed` | `bidMutation.onSuccess` | `live_id`, `auction_id`, `amount_cents`, `bid_increment: 1\|5\|10` | **exists** | LiveDetailsPage.hooks.ts |
| `auction_bought_out` | `buyoutMutation.onSuccess` | `live_id`, `auction_id`, `buyout_price_cents` | **exists** | LiveDetailsPage.hooks.ts |
| `auction_extended` | WebSocket `auction:extended` event received | `live_id`, `auction_id` | nice-to-have | LiveDetailsPage — WebSocket subscription |
| `auction_won` | WebSocket `auction:closed` event received by winner | `live_id`, `auction_id`, `final_price_cents` | planned | LiveDetailsPage — WebSocket subscription (requires new subscription) |
| `auction_lost` | WebSocket `auction:closed` received by non-winner bidder | `live_id`, `auction_id` | nice-to-have | LiveDetailsPage — WebSocket subscription |
| `product_added_to_live` | `associateMutation.onSuccess` | `live_id`, `product_id` | nice-to-have | LiveDetailsPage.hooks.ts |

---

## Priority Queue

Implement in this order — each one unlocks a key funnel metric:

| Priority | Event | Why it matters |
|----------|-------|----------------|
| 1 | `user_identified` (`posthog.identify`) | Links anonymous landing-page events to authenticated users — must go in first |
| 2 | `sign_up_completed` | Measures top-of-funnel acquisition; without it attribution is blind |
| 3 | `login_completed` | Measures retention and re-engagement |
| 4 | `onboarding_completed` | Measures buyer activation (first step before any transaction) |
| 5 | `live_joined` | Core engagement metric — how many buyers actually watch |
| 6 | `bid_placed` | Core monetisation signal |
| 7 | `order_paid` | Revenue event — pair with Stripe webhook for reconciliation |
| 8 | `auction_started` | Seller activation depth metric |
| 9 | `seller_onboarding_submitted` | Supply-side activation — are sellers completing the survey? |
| 10 | `product_created` | Seller activation depth |

---

## Naming Conventions

- **snake_case** for all event names
- Pattern: `<noun>_<past_tense_verb>` (e.g. `live_joined`, `bid_placed`, `order_paid`)
- Boolean properties: `is_*` prefix (e.g. `is_host`, `is_first_bid`)
- ID properties: always `*_id` suffix (e.g. `live_id`, `seller_id`, `auction_id`)
- Amounts: always in **cents** as integers (e.g. `amount_cents: 1500`), matching Stripe convention
- Durations: always in **seconds** as integers
- **Never include PII** (email, full name, phone) in event properties — use `posthog.identify()` for user traits

---

## Implementation Pattern

PostHog calls belong **exclusively in `.hooks.ts` files**, never in `.tsx` view files. Same rule as tRPC calls.

```typescript
// In a .hooks.ts file
import posthog from "posthog-js";

// After login/signup — identify the user so all events are linked
posthog.identify(user.id.toString(), {
  role: user.role,           // "BUYER" | "SELLER"
  created_at: user.createdAt,
});

// Track a bid
posthog.capture("bid_placed", {
  live_id: Number(liveId),
  auction_id: activeAuction.id,
  amount_cents: Math.round(amount * 100),
  bid_increment: bidIncrement,   // 1 | 5 | 10
});

// Track seller onboarding step
posthog.capture("seller_onboarding_step_completed", {
  step_index: stepIndex,      // 0–9
  step_name: STEP_NAMES[stepIndex],
});
```

---

## Summary

| Status | Count |
|--------|-------|
| **exists** | 29 events |
| **planned** | 2 events (`login_started`, `auction_won`) |
| **nice-to-have** | 18 events |
| **automatic** | `$pageview`, `$pageleave` (PostHog init) |

**Remaining planned events:**
- `login_started` — fire on LoginPage mount (straightforward)
- `auction_won` — requires adding a WebSocket subscription for `auction:closed` on the buyer side; the server already broadcasts this event but the frontend has no listener yet
