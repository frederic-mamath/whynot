# Ticket 002 — ESLint with strict ruleset

## Goal

Add ESLint to `ios-app/` with a ruleset that flags the patterns the recent audit surfaced: missing `useEffect` deps, silently swallowed promises, empty `catch` blocks, `console.log` in production, `any` types, and files longer than 400 lines.

The two monster files (`app/seller-live/[liveId].tsx` 937 lines, `app/(tabs)/seller/lives/[id].tsx` 718 lines) get a temporary `// eslint-disable max-lines` annotation. Those disables are removed by tickets 011 and 012 when each file is decomposed.

## Acceptance Criteria

- As a developer, when I run `npm run lint` from `ios-app/`, ESLint runs over `app/`, `src/`, and `scripts/`
- As a developer, the linter fails on: missing `react-hooks/exhaustive-deps`, floating promises, empty catches, `console.log`, `any`, files > 400 lines
- As a developer, the existing codebase passes lint (either by fixing or by inline annotations carrying TODO refs to follow-up tickets)
- As a developer, CI (from T-001) runs `npm run lint` and fails the job on lint errors
- As a developer, when I save a file in VS Code with the ESLint extension active, errors highlight inline

## Technical Strategy

- Frontend / Tooling
  - `ios-app/package.json`
    - devDeps: `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-native`, `eslint-config-prettier`
    - Script: `"lint": "eslint . --ext .ts,.tsx --max-warnings 0"`
  - `ios-app/.eslintrc.cjs`
    - Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, `prettier`
    - `parser: "@typescript-eslint/parser"`, `parserOptions.project: "./tsconfig.json"` (required for `no-floating-promises`)
    - Rules at error level:
      - `react-hooks/exhaustive-deps`
      - `@typescript-eslint/no-floating-promises`
      - `no-empty: ["error", { allowEmptyCatch: false }]`
      - `no-console: ["error", { allow: ["warn", "error"] }]`
      - `@typescript-eslint/no-explicit-any`
      - `max-lines: ["error", { max: 400, skipBlankLines: true, skipComments: true }]`
    - `settings.react.version: "detect"`
  - `ios-app/.eslintignore`
    - `node_modules`, `ios/`, `android/`, `.expo/`, `dist/`, `metro.config.js`, `babel.config.js`
- Fix or annotate existing violations
  - `app/seller-live/[liveId].tsx` — top-of-file `/* eslint-disable max-lines */` with `// TODO: removed by ticket-011`
  - `app/(tabs)/seller/lives/[id].tsx` — same with `// TODO: removed by ticket-012`
  - `src/lib/trpc.ts`, `src/lib/agora.ts`, `src/components/live/ChatPanel.tsx` — replace `console.log` with `console.warn` if diagnostic, or `// eslint-disable-next-line no-console` with TODO ref to T-007 (logger work folded into agora session extraction)
  - `src/lib/agora.ts` — `any` casts at the JSI bridge boundary get `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with TODO ref to L1 follow-up (deferred)
  - `app/live/[liveId].tsx`, `app/seller-live/[liveId].tsx` — `event as { type: ... }` casts get `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with TODO ref to T-008
- CI integration
  - `.github/workflows/ci.yml` — append `npm run lint` step after `npm run arch:test`

## Verification

```bash
cd ios-app && npm run lint
```

Exits 0. Intentionally add `console.log("x")` in `src/lib/auth.ts` → lint fails. Revert → passes.

## Manual operations to configure services

None.
