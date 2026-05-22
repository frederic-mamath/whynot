# Architecture Tests (Fitness Functions)

## Status: PARKED (2026-05-22) — backlog, not active

This feature is intentionally **not started**. Logged here so the analysis from the planning discussion isn't lost. Pick up when:
- The current App Store / Play Store cycles for features 060 (EAS Update) and 062 (Android) are no longer blocked
- The TestFlight feedback signal is settled and there's no urgent product work in flight

Estimated effort when resumed: **~half a day** (single ticket).

## Initial Prompt

The project has unusually well-documented architectural conventions in CLAUDE.md files. Today they're enforced by manual review + Claude reading the docs. That works until it doesn't — at least one drift (Stripe merchant ID between plugin and runtime) made it into a TestFlight build. Architecture tests would catch this class of drift automatically without adding a full test framework.

## Approach

- **Two tools, each with one responsibility:**
  - `dependency-cruiser` (one new dev dep) for **layering** rules — "module X must not import from module Y" — expressed declaratively in `.dependency-cruiser.cjs`
  - A small hand-rolled `scripts/arch-test.mjs` (zero deps) for **regex** rules — "no hex codes in `ios-app/app/**/*.tsx`", "no `useState` in `pages/**/*.tsx`"
- **Wired into the existing `prebuild:*` hooks** in `app/package.json` and `ios-app/package.json` (the same pattern feature 064 used for the design-tokens generator). Failing arch checks fail the build with a clear message.
- **Documented in CLAUDE.md** so future contributors know the rules are enforced, not just suggested.

## Six highest-value rules to enforce on day one

| # | Rule | Tool | Reason |
|:---|:---|:---|:---|
| 1 | `app/src/routers/**` cannot import `app/src/db/` | dep-cruiser | Backend layering — must go through repositories |
| 2 | `app/client/src/pages/**/*.tsx` cannot import `@trpc/*` or use `useState`/`useEffect` | custom regex | Headless component pattern |
| 3 | `app/client/src/**/*.tsx` cannot use raw Tailwind color classes (`bg-white`, `text-red-500`, …) | custom regex | Force semantic tokens |
| 4 | `ios-app/app/**/*.tsx` and `ios-app/src/**/*.tsx` cannot contain `#[0-9A-Fa-f]{3,8}` (except in `src/theme/tokens.ts`) | custom regex | Force `Colors.*` from tokens (Feature 064) |
| 5 | Repository classes can only be imported from `app/src/repositories/index.ts` | dep-cruiser | Singleton pattern hygiene |
| 6 | Only `app/client/src/lib/trpc.ts` may import from `@trpc/client` / `@trpc/react-query` | dep-cruiser | Single tRPC entry point |

## Out of Scope

- **Unit / integration testing** — this feature is structural rules only, not behavior tests
- **ESLint custom rule plugins** — dep-cruiser + regex cover the high-value cases without setting up an ESLint plugin pipeline
- **Pre-commit hooks** — running on `prebuild` (which Render runs anyway) is sufficient; pre-commit can be a later refinement
- **CI parallelization** — the checks run in <2s, no need to optimize yet
- **All current violations cleanup** — if existing code violates a rule, fix the rule's scope (exclude legacy paths) rather than rewriting the violations en masse. The goal is **stopping new drift**, not retro-cleaning the codebase.

## Tickets

| Ticket     | Description                                                                  | Status   |
| :--------- | :--------------------------------------------------------------------------- | :------- |
| ticket-001 | Install dep-cruiser + write 6 arch rules (dep-cruiser config + custom script) + wire prebuild hooks + document in CLAUDE.md files | planned  |

## User Stories

| User Story                                                                                                       | Status   |
| :--------------------------------------------------------------------------------------------------------------- | :------- |
| As a developer, when I write a router that imports `db` directly, the build fails with a clear message         | planned  |
| As a developer, when I add a hex code to a mobile screen (other than `tokens.ts`), the build fails              | planned  |
| As a developer, when I add a `useState` or tRPC call to a `Page.tsx` view, the build fails                      | planned  |
| As a developer, when I add a `bg-white` or `text-red-500` class anywhere in the web client, the build fails    | planned  |
