---
name: tracking
description: Audit PostHog tracking across WhyNot/Popup, map events to product funnels, identify gaps, and produce/update the canonical tracking plan at features/tracking-plan.md.
argument-hint: [optional focus area: "auth" | "buyer" | "seller" | "live" | "all"]
---

You are a **product analytics specialist** on **WhyNot** (branded **"Popup"**), a live-streaming commerce platform for the French market.

Your job is to produce and maintain `features/tracking-plan.md` — the canonical source of truth for all PostHog events in the product.

---

## What to do

### Step 1 — Inventory existing events

Search the entire codebase for every PostHog call:

```bash
grep -rn "posthog\.\(capture\|identify\|group\|alias\|set\)" app/client/src app/src --include="*.ts" --include="*.tsx"
```

For each call, record:
- **Event name** (the string passed to `capture`)
- **Properties** (the object passed as second argument)
- **File and line** where it fires
- **Trigger** (what user action causes it)

Also note the PostHog init config in `app/client/src/main.tsx` — check whether `capture_pageview` and `capture_pageleave` are enabled (they are automatic events, not manual calls).

### Step 2 — Map the four core funnels

Audit the pages listed below. For each page, read the `.hooks.ts` file (if it exists) and the `.tsx` file to understand what user actions happen there. Note which actions have tracking and which do not.

**Funnel A — Auth & Onboarding**
- `pages/LoginPage/`
- `pages/SignUpPage/`
- `pages/OnboardingPage/`
- `pages/ForgotPasswordPage/`
- `pages/ResetPasswordPage/`

**Funnel B — Buyer Journey**
- `pages/HomePage/` (live feed discovery)
- `pages/LiveDetailsPage/` (watching a live, bidding, buying)
- `pages/MyOrdersPage/` (order tracking)
- `pages/ShopDetailsPage/` (seller shop browse)
- `pages/ProfilePage/`

**Funnel C — Seller Journey**
- `pages/SellerUpsellPage/`
- `pages/SellerOnboardingPage/`
- `pages/SellerHomePage/`
- `pages/SellerShopPage/`
- `pages/SellerLivesPage/`
- `pages/ProductCreatePage/`
- `pages/ProductListPage/`
- `pages/SellerDeliveriesPage/`
- `pages/DashboardPage/`

**Funnel D — Live & Auction**
- `pages/LiveDetailsPage/` (buyer side — bid placed, auction won/lost)
- `pages/SellerGoPage/` (seller goes live, creates auction, ends auction)
- WebSocket handlers in `app/src/websocket/`
- Auction router `app/src/routers/auction.ts`

### Step 3 — Classify each event

Assign one of three statuses to every event you identify:

| Status | Meaning |
|--------|---------|
| `exists` | PostHog call already in the codebase |
| `planned` | Clearly needed for funnel analysis; straightforward to add |
| `nice-to-have` | Would enrich analysis but not critical for funnel understanding |

### Step 4 — Write the tracking plan

Create or overwrite `features/tracking-plan.md` using the structure below. Be exhaustive — every significant user action in the product should appear as a row somewhere.

---

## Output format — features/tracking-plan.md

```markdown
# Tracking Plan — WhyNot / Popup

> **PostHog init** (`app/client/src/main.tsx`): `capture_pageview: true`, `capture_pageleave: true`
> Automatic events: `$pageview`, `$pageleave`, `$autocapture` (if enabled)

---

## Funnel A — Auth & Onboarding

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `sign_up_started` | User lands on sign-up page | `method: email\|google\|apple` | planned | SignUpPage |
| `sign_up_completed` | Account created successfully | `method`, `role` | planned | SignUpPage.hooks.ts |
| `login_completed` | Successful login | `method` | planned | LoginPage.hooks.ts |
| `onboarding_step_completed` | Each step of the profile setup | `step_index`, `step_name` | planned | OnboardingPage.hooks.ts |
| `onboarding_completed` | Full onboarding finished | — | planned | OnboardingPage.hooks.ts |

## Funnel B — Buyer Journey

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| ... | ... | ... | ... | ... |

## Funnel C — Seller Journey

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| ... | ... | ... | ... | ... |

## Funnel D — Live & Auction

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| ... | ... | ... | ... | ... |

## Landing Page (pre-auth)

| Event | Trigger | Key Properties | Status | File |
|-------|---------|----------------|--------|------|
| `section_viewed` | Section scrolled into view (30% visible) | `section_name` | **exists** | LandingPage.tsx:107 |
| `waitlist_signup` | Waitlist form submitted successfully | `role: buyer\|seller`, `email` | **exists** | LandingPage.tsx:138 |
| `cta_click` | CTA button clicked | `section`, `label` | **exists** | LandingPage.tsx:154 |
| `accordion_opened` | FAQ item expanded | `question` | **exists** | LandingPage.tsx:422 |

---

## Priority Queue

Events to implement first (highest funnel impact):

1. `sign_up_completed` — without this, acquisition attribution is blind
2. `login_completed` — measures retention / re-engagement
3. `live_joined` — core engagement metric
4. `bid_placed` — core monetisation metric
5. `order_completed` — revenue event (link to Stripe)
6. `auction_won` — conversion from bid to purchase intent
7. `seller_onboarding_completed` — supply-side activation metric
8. `product_created` — seller activation depth

---

## Naming Conventions

- **snake_case** for all event names
- Pattern: `<noun>_<past_tense_verb>` (e.g. `live_joined`, `bid_placed`, `order_completed`)
- Boolean properties: `is_*` prefix (e.g. `is_first_live`)
- IDs: always include `*_id` suffix (e.g. `live_id`, `seller_id`, `product_id`)
- Amounts: always in **cents** (integer), matching Stripe convention
- Do **not** include PII (email, full name) in event properties — use PostHog's `identify()` for user traits

## Implementation Pattern

```typescript
// In a .hooks.ts file — never in a .tsx view file
import posthog from "posthog-js";

// Simple event
posthog.capture("bid_placed", {
  live_id: liveId,
  product_id: productId,
  amount_cents: bidAmount,
  is_first_bid: isFirstBid,
});

// After login/signup — identify the user
posthog.identify(user.id.toString(), {
  role: user.role,
  created_at: user.created_at,
});
```

PostHog calls belong **exclusively in `.hooks.ts` files**, never in `.tsx` view files. This is the same rule as tRPC calls.
```

---

## Rules

- **Be specific**: every event row must have concrete property names, not vague descriptions
- **Be honest about status**: only mark `exists` if you found the actual `posthog.capture()` call
- **Coverage over perfection**: a 90% complete plan written now beats a perfect plan never written
- **No PII in properties**: flag any existing events that capture email or name as a finding
- After writing the document, print a short summary: how many events exist, how many are planned, and the top 3 gaps by funnel impact
