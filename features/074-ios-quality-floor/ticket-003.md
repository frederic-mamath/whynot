# Ticket 003 — arch-test R7/R8/R9 (fetch, Alert, design tokens)

## Goal

Extend `scripts/arch-test.mjs` with three new rules that the recent audit flagged as patterns the codebase has already produced:
- **R7** — no direct `fetch(` calls outside `ios-app/src/lib/` (CLAUDE.md forbids it; not enforced today)
- **R8** — no `Alert.alert(` outside `ios-app/src/lib/alerts.ts` (today there are ~26 ungoverned call sites — they will be migrated by T-006 and T-015)
- **R9** — no raw `fontSize: \d` / `borderRadius: \d` / `padding(Horizontal|Vertical)?: \d` outside `ios-app/src/theme/tokens.ts`

> **Numbering note** — the existing R5 (`no-direct-repository-imports`) and R6 (`no-raw-trpc-import`) live in `app/.dependency-cruiser.cjs`. The new arch-test rules skip those numbers to avoid the conflict.

R7 should land clean. R8 needs an exclusion list seeded with current call sites. R9 will produce many violations on day-1 — seeded into a TODO exclusion list and removed in T-014.

## Acceptance Criteria

- As a developer, when I run `npm run arch:test`, R7/R8/R9 are evaluated alongside R2/R3/R4
- As a developer, R7 fails if any TS/TSX file outside `ios-app/src/lib/` contains `\bfetch\(`
- As a developer, R8 fails if any file outside the R8 whitelist contains `Alert\.alert\(`
- As a developer, R9 fails if any file outside the R9 exclusion list contains a hardcoded `fontSize: \d` / `borderRadius: \d` / `paddingHorizontal: \d` / `paddingVertical: \d` / `padding: \d`
- As a developer, `npm run arch:test` exits 0 today (existing violations are seeded as TODO exclusions for R8 and R9)

## Technical Strategy

- Frontend / Tooling
  - `scripts/arch-test.mjs`
    - Add `R7_PATTERN = /\bfetch\(/`. Scan `ios-app/app` + `ios-app/src` excluding any path under `ios-app/src/lib/`. No exclusion list expected.
    - Add `R8_PATTERN = /\bAlert\.alert\(/`. Scan same dirs with `R8_EXCLUDE` seeded from current call sites (~10 files). Each excluded entry carries a comment naming the ticket that removes it (T-006 or T-015).
    - Add `R9_PATTERNS = [/\bfontSize:\s*\d/, /\bborderRadius:\s*\d/, /\bpaddingHorizontal:\s*\d/, /\bpaddingVertical:\s*\d/, /\bpadding:\s*\d/]`. Scan same dirs with always-excluded `ios-app/src/theme/tokens.ts`. Seed `R9_EXCLUDE` with current violators by running the rule once, capturing the list. Each excluded entry carries `// TODO: removed by ticket-014`.
    - All three rules follow the regex/walk/check structure already used by R4
  - Update the rule banner comment at the top of the file to reflect "Rules R2, R3, R4, R7, R8, R9"

## Verification

```bash
cd ios-app && npm run arch:test
```

Output ends with `Architecture checks passed (R2, R3, R4, R7, R8, R9).` Intentionally add `fetch("/x")` in `src/components/LiveCard.tsx` → R7 fails with the file:line.

## Manual operations to configure services

None.
