# Pre-launch checklist — iOS soft launch

> Last updated: 2026-05-29 (post feature 070)
> Status: **discovery document, not a backlog** — items here become features only after PO confirmation.

## Context

The iOS app has shipped 16 feature folders covering buyer + seller. Features 055–070 are merged. The app has been submitted to the App Store at least once (057 + 059 resubmission). Soft launch is the next milestone. This document catalogs the gaps between "code complete" and "successful launch".

## Definition of success (from PO conversation, 2026-05-29)

> "Attract users on the app and have them buy products so it can generate revenue to keep the project alive."

So the launch is successful if **users sign up → watch a live → bid → buy**. Every gap below is justified against that funnel.

---

## Tier 1 — Blocks launch / blocks measurement

### 1.1 — GDPR posture
**Status:** ❌ not handled on web or iOS
**Why it blocks:** PostHog tracking without consent or anonymization is illegal in France. CNIL fines start at €10K.
**Two paths:**
- **A.** Cookieless / anonymous-until-login mode (PostHog `person_profiles: 'identified_only'` + IP anonymization). Works for the post-signup funnel.
- **B.** Consent banner before any tracking fires. Industry standard but ~30% decline rate.
**Recommended:** A. Loses pre-signup pageview tracking but answers the actual business question.

### 1.2 — PostHog iOS critical funnel
**Status:** ❌ zero events on iOS today (web has ~50)
**Why it blocks:** Without it, the launch is blind. You cannot answer "did the soft launch work?"
**Scope for v1:** ~7 events to compute the four ratios:
- `sign_up_completed` (denominator)
- `live_viewed`
- `bid_placed`
- `purchase_completed`
- `login_completed` (for returning user dedup)
- `auction_won` (qualifies bidders for purchase eligibility)
- `checkout_started` (diagnoses gap between purchase eligibility and paid)
**Identity stitching:** call `posthog.identify(userId)` on every login/signup success — same `userId` as web → cross-platform user dedup works for free.

### 1.3 — Crash reporting (Sentry React Native)
**Status:** ❌ not installed
**Why it blocks:** App Store crashes are otherwise invisible. The only signal is 1-star reviews after the fact. For a payment-handling app this is unacceptable.
**Scope:** install `@sentry/react-native`, wire up to a project, source-map upload via EAS. ~1 day.

---

## Tier 2 — Major retention/growth levers, not strictly blockers

### 2.1 — Push notifications
**Status:** ❌ no push setup. Outbid notification (feature 068) is in-app only — fires only if the app is foregrounded.
**Why it matters:** Live commerce is time-sensitive. Three killer notifications:
- "Live starting in 10 min" — recovers users who scheduled but forgot
- "You've been outbid" — drives re-engagement during an auction (currently the banner only works if the user has the app open)
- "Your order shipped" — closes the loop
**Scope:** expo-notifications + APNs cert + server-side trigger jobs. ~3–4 tickets.

### 2.2 — Deep links / universal links
**Status:** ❌ no `apple-app-site-association` configured
**Why it matters:** Share a live URL on Instagram/TikTok → opens in app instead of Safari. Critical for the seller virality loop (sellers will share their live links externally).
**Scope:** AASA file on the API domain + iOS associated domains + expo-router deep link config. ~1 day.

---

## Tier 3 — Quality of life, defer post-launch

### 3.1 — In-app review prompt
`SKStoreReviewController` after a successful purchase. Boosts App Store rating. Half day.

### 3.2 — Force-update / kill switch
Currently EAS Update can patch JS only. If a native bug ships, no recall mechanism. A server-returned "minimum supported version" check at app start, with a blocking screen telling the user to update. ~1 day.

### 3.3 — Performance monitoring
After Sentry is in, enable performance traces. Useful for diagnosing slow live joins / slow checkouts. ~half day add-on.

### 3.4 — Accessibility audit
VoiceOver labels, dynamic type, contrast. Legally required eventually (EAA in 2025+). Not soft-launch blocker.

### 3.5 — English localization
The market is French-only per CLAUDE.md. App Store reviewers may test on English locale though — risk of rejection if strings break. Low priority but verify.

---

## Suggested launch sequence

1. **GDPR posture** (Option A) — half day
2. **PostHog iOS critical funnel** — 1 day, dependent on #1
3. **Sentry crash reporting** — 1 day, parallel-safe
4. **Push notifications** — 3–4 days, biggest retention win
5. **Deep links** — 1 day
6. Soft launch → observe funnel → iterate

Tier 3 items are post-launch.
