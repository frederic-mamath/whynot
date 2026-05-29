# Feature 071 — PostHog tracking on iOS (critical funnel)

## Initial prompt

> "I want to add PostHog tracking on iOS to understand user behavior. Question to answer: of all signed-up users, how many have seen at least one live, how many have placed at least one bid, and how many have bought at least one item."

## Scope

Wire PostHog into the iOS app with a GDPR-safe configuration (anonymous-until-identified mode, no consent banner needed) and instrument **seven critical funnel events** that answer the four post-launch ratios:

- signed up → at least one `live_viewed`
- signed up → at least one `bid_placed`
- signed up → at least one `auction_won`
- signed up → at least one `purchase_completed`

Identity is stitched cross-platform via `posthog.identify(userId)` using the same userId as the web app — a buyer on both platforms counts as one user.

## Explicitly out of scope

- Pre-signup / anonymous app-open events (Option A trade-off — no consent banner means we wait for login to identify)
- Web parity (other 50+ events in `features/tracking-plan.md`)
- Session recordings, surveys, feature flags
- Sentry / crash reporting (documented in `features/pre-launch-checklist.md` as Tier 1.3, separate feature)
- Push notifications (documented in pre-launch-checklist.md as Tier 2.1, separate feature)

## User Stories

| User Story | Status |
| :--------- | :----- |
| As an operator, I can install PostHog on iOS without showing a consent banner (Option A: identified-only mode) | planned |
| As an operator, a buyer who signs up on iOS and a buyer who signs up on web appear as one user in PostHog | planned |
| As an operator, on each successful sign-up I see a `sign_up_completed` event | planned |
| As an operator, on each successful login I see a `login_completed` event | planned |
| As an operator, when a user enters a live screen with status="active" I see a `live_viewed` event | planned |
| As an operator, when a bid is successfully placed I see a `bid_placed` event | planned |
| As an operator, when a user wins an auction I see an `auction_won` event | planned |
| As an operator, when the Stripe sheet opens I see a `checkout_started` event | planned |
| As an operator, when a payment succeeds I see a `purchase_completed` event | planned |
