# ticket-001 — Install dep-cruiser + write 6 arch rules + wire prebuild + document

## Goal

Set up automated enforcement of the six highest-value architectural invariants documented in CLAUDE.md files. When this ticket ships, breaking any of the six rules in a new file fails the build with a clear message.

## Acceptance Criteria

- As a developer, `dependency-cruiser` is installed as a dev dep in `app/` (and only `app/`, since both web and backend live there)
- As a developer, `app/.dependency-cruiser.cjs` declares 3 layering rules (rules #1, #5, #6 from `summary.md`)
- As a developer, `scripts/arch-test.mjs` at the repo root declares 3 regex rules (#2, #3, #4 from `summary.md`) — zero npm deps, ESM, runs in <2s on the full repo
- As a developer, `app/package.json` and `ios-app/package.json` invoke both checks via the existing `prebuild:*` hook chain (mirroring the design-tokens generator wiring from feature 064)
- As a developer, introducing a deliberate violation of any of the six rules in a fresh file causes the next `npm run build:client` to fail with a diagnostic that names the file, the rule, and the offending pattern / import
- As a developer, the **existing** codebase passes all six checks — if any pre-existing file violates a rule, the rule's scope is narrowed (e.g., exclude that path) until a follow-up cleanup. Document the exclusion in the config with a `TODO:` comment naming the file. The goal of v1 is **catching new drift**, not retroactive enforcement.
- As a developer, the root `CLAUDE.md`, `app/CLAUDE.md`, `app/client/CLAUDE.md`, `app/src/CLAUDE.md`, and `ios-app/CLAUDE.md` each gain a short "Architecture tests" section pointing at the config files and listing which rules apply to that directory

## Technical Strategy

- Repo root
  - File *(create)*
    - `scripts/arch-test.mjs` — Node ESM script, no deps. Walks specified directories with `fs.readdirSync({ recursive: true })`, applies regex per rule, prints violations, `process.exit(1)` if any. Three rules:
      - **Rule R2 — Headless component pattern**: any file matching `app/client/src/pages/**/*.tsx` (excluding `*.hooks.ts`) must not contain `\bfrom\s+['"]@trpc/`, `\buseState\(`, `\buseEffect\(`, `\buseQuery\(`, `\buseMutation\(`
      - **Rule R3 — No raw Tailwind colors on web**: any file under `app/client/src/**/*.{tsx,jsx,ts}` (excluding `lib/`, `components/ui/`) must not match `\b(bg|text|border|ring|fill|stroke)-(white|black|gray|zinc|slate|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d+)?\b`
      - **Rule R4 — No hex codes in mobile**: any file under `ios-app/app/**/*.tsx` or `ios-app/src/**/*.{tsx,ts}` (excluding `src/theme/tokens.ts`) must not match `#[0-9A-Fa-f]{6,8}\b` or `#[0-9A-Fa-f]{3}\b`. Diagnostic should include line number.
- Backend (`app/`)
  - Packages
    - `app/package.json` — `npm install -D dependency-cruiser`
  - Config *(create)*
    - `app/.dependency-cruiser.cjs` — three rules:
      - **R1 — Routers can't import db**: `from: { path: "^src/routers/" }, to: { path: "^src/db/" }` → error
      - **R5 — Repository singleton hygiene**: any file outside `^src/repositories/` cannot import a file matching `^src/repositories/.*Repository\\.ts$` directly (only via `src/repositories/index.ts`) → error
      - **R6 — tRPC entry point hygiene**: `from: { pathNot: "^client/src/lib/trpc\\.ts$" }, to: { path: "^node_modules/@trpc/(client|react-query)" }` → error
    - `app/package.json` script: `arch:test:deps`: `depcruise src client --config .dependency-cruiser.cjs`
- Build pipeline
  - `app/package.json`
    - Add `arch:test` script that runs both: `node ../scripts/arch-test.mjs && npm run arch:test:deps`
    - Chain into existing `prebuild:client` and `prebuild:server` (append `&& npm run arch:test`)
  - `ios-app/package.json`
    - Add `arch:test` script: `node ../scripts/arch-test.mjs`
    - Chain into a new `predev` / etc hook (or add as a one-off `npm run arch:test` call in the existing `postinstall`)
- Documentation
  - Root `CLAUDE.md` — add short "Architecture tests" section pointing at the two config files
  - `app/CLAUDE.md` — list R1, R5, R6 with one-line explanations
  - `app/client/CLAUDE.md` — list R2, R3
  - `app/src/CLAUDE.md` — reference R1, R5, R6
  - `ios-app/CLAUDE.md` — list R4, point at `src/theme/tokens.ts` as the only legitimate hex-code location

## Verification

- Run `npm run arch:test` from `app/` — should pass with the current codebase (after any narrow exclusions are added for legacy violators)
- Insert a deliberate violation in a fresh file, re-run — should fail with a clear diagnostic
- Revert the violation, re-run — should pass again
- `npm run build:client` — should automatically run `arch:test` first via `prebuild:client`

## Out of Scope

- Refactoring existing code to satisfy the rules — exclusions are acceptable v1
- Adding more rules beyond the six listed — additive PRs after this lands
- Hooking into pre-commit (husky etc.) — prebuild is enough
- Editor integration (VS Code squigglies) — would need ESLint custom plugins, deferred
