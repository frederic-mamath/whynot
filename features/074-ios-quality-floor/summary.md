# Feature 074 — iOS quality floor (tooling + audit follow-ups)

## Initial prompt

> "The product has reached MVP and is waiting for business-partner feedback. A new developer is joining within 90 days. I want past-Frederic to have built a system where future-Frederic doesn't act like a bot reviewing file architecture and static typing — energy should go to business features instead. I also want to shrink the CLAUDE.md files by moving rules into static checkers."

## Scope decision

This feature implements **tooling-first** robustness. Phase 1 stands up the quality floor (CI, ESLint, extended arch-test, knip, jscpd). Phases 2–4 leverage that floor to fix the 5 High-risk and 6 Medium-inconsistency items the recent ios-app audit surfaced.

Tooling lands first so subsequent refactor tickets benefit from regression protection while they're underway. The user may stop after any phase and ship — the app is buildable at every step.

After the feature lands, `ios-app/CLAUDE.md` shrinks by ~30%: cache strategy, design-token enforcement, error-handling conventions, and "no raw fetch" are all moved out of prose and into enforced rules.

## Explicitly out of scope

- Test framework (Jest, Detox, Vitest) — separate feature, not driven by this audit
- Backend (`app/`) changes EXCEPT exporting the `LiveEvent` discriminated union in T-008 — explicitly authorized in PO scope confirmation
- React Native architecture migration (already on New Arch)
- Performance work (FlatList virtualization beyond ChatPanel, image optimization, bundle size)
- Accessibility audit
- i18n cleanup
- L-tier audit items: L1 (typed agora.ts JSI surface) deferred; L3 (residual useEffect deps) covered by ESLint in T-002; L4 (PostHog identify race) and L5 (dead comments) are drive-by hygiene

## Budget

20 developer-days. Phase 1: 4d / Phase 2: 6d / Phase 3: 7d / Phase 4: 3d.

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a developer, my PR is gated by automated tooling (typecheck, lint, arch-test, dead-code, duplication) before code review | planned |
| As a developer, the ESLint config flags the audit's recurring patterns (missing useEffect deps, floating promises, empty catches, large files) | planned |
| As a developer, `npm run arch:test` enforces no raw `fetch`, no inline `Alert.alert`, no hardcoded `fontSize`/`borderRadius`/`padding` | planned |
| As a developer, knip and jscpd flag dead exports and duplicated code on every PR | planned |
| As a buyer, when an action fails (bid, payment, address save), I see a clear message instead of a stuck spinner or silent dismiss | planned |
| As a buyer, when I leave a live and re-enter, the video feed renders cleanly without stale state from the previous session | planned |
| As a developer, live event payload types flow from the backend to both iOS live screens, with exhaustiveness checks on the type discriminator | planned |
| As a user, when my session expires, the app logs me out and routes me to welcome instead of leaving me with broken requests | planned |
| As a user, when I create or edit data (address, product, profile), the UI reflects the change instantly without a loading flash | planned |
| As a seller, the broadcaster and live management screens have predictable, small components I can navigate without scrolling for a kilometer | planned |
| As a buyer, Stripe error messages are surfaced consistently across the checkout and card-setup flows | planned |
| As a user, the visual rhythm of spacing, padding, and typography is uniform across every screen | planned |
| As a user, pull-to-refresh and destructive-action dialogs behave identically across all screens | planned |

## Ticket sequence

15 tickets across 4 phases. Each leaves the app buildable.

| # | Phase | Title | Days |
|---|-------|-------|------|
| 001 | 1 — Foundations | GitHub Actions CI (typecheck + arch:test) | 1 |
| 002 | 1 — Foundations | ESLint with strict ruleset | 1 |
| 003 | 1 — Foundations | arch-test R7/R8/R9 (fetch, Alert, design tokens) | 1 |
| 004 | 1 — Foundations | knip + jscpd in CI | 1 |
| 005 | 2 — High-risk fixes | useErrorBanner + useMutationWithToast hooks | 1 |
| 006 | 2 — High-risk fixes | Migrate all mutations to error-surfacing hooks | 2 |
| 007 | 2 — High-risk fixes | useAgoraSession extraction (live + seller-live) | 2 |
| 008 | 2 — High-risk fixes | Shared LiveEvent discriminated union (backend + iOS) | 1 |
| 009 | 3 — Auth & inconsistency | tRPC 401 middleware + auth recovery | 1 |
| 010 | 3 — Auth & inconsistency | optimisticUpdate helper + cache strategy sweep | 2 |
| 011 | 3 — Auth & inconsistency | seller-live decomposition | 2 |
| 012 | 3 — Auth & inconsistency | seller/lives/[id] decomposition | 1 |
| 013 | 3 — Auth & inconsistency | Stripe hooks (usePopupCheckout, usePopupSetupIntent) | 1 |
| 014 | 4 — Token finish + polish | Spacing/Radius/Typography token sweep | 2 |
| 015 | 4 — Token finish + polish | useRefreshControl + useConfirm hooks | 1 |

## Phase boundaries

- **After Phase 1** — every future PR is automatically gated. Even if Phases 2–4 don't ship, regressions in any other feature are caught.
- **After Phase 2** — every user-facing failure mode from the High audit is fixed. Phase 1 ensures they won't regress.
- **After Phase 3** — the codebase is internally consistent. New-developer onboarding cost drops significantly.
- **After Phase 4** — `ios-app/CLAUDE.md` can be trimmed by ~30%.

## CLAUDE.md cleanup mapping

After this feature ships, the following sections in `ios-app/CLAUDE.md` move from prose into enforced rules:

| Today (prose) | Tomorrow (enforced) |
|---|---|
| "Cache Update Strategy" section | Codified in `optimisticUpdate()` helper (T-010) |
| "Styling" section on hardcoded values | R9 in `arch-test.mjs` (T-003) |
| "Do not call fetch directly" | R7 in `arch-test.mjs` (T-003) |
| "Architecture Tests" table grows from R2–R4 to R2–R4, R7–R9 | Updated reference table |
