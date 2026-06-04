# Ticket 004 — knip + jscpd in CI

## Goal

Add two static analysis tools that catch what TypeScript and ESLint cannot:
- **knip** — dead-code/exports detector (unused exports, unused files, unused dependencies, unlisted dependencies)
- **jscpd** — copy-paste detector that flags near-duplicate blocks across files

Both run in CI on every PR and fail the job on new findings above a configured threshold.

## Acceptance Criteria

- As a developer, when I run `npm run dead-code` from `ios-app/`, knip lists unused exports/files/dependencies
- As a developer, when I run `npm run duplication` from `ios-app/`, jscpd lists near-duplicate blocks across `app/` and `src/`
- As a developer, both commands exit 0 today (existing codebase is seeded into ignore configs with TODO refs for follow-ups in T-011, T-012, T-013)
- As a developer, CI runs both tools after lint and fails on regressions

## Technical Strategy

- Frontend / Tooling
  - `ios-app/package.json`
    - devDeps: `knip`, `jscpd`
    - Scripts: `"dead-code": "knip"`, `"duplication": "jscpd src/ app/ --threshold 0"`
  - `ios-app/knip.json`
    - `entry: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"]`
    - `project: ["**/*.{ts,tsx}"]`
    - `ignore: ["ios/**", "android/**", ".expo/**"]`
    - `ignoreDependencies` — initial entries for any false positives surfaced by `npx knip --reporter json` (e.g. expo-router auto-imported entries)
  - `ios-app/.jscpdrc.json`
    - `threshold: 0` (any duplication above the size threshold fails the job)
    - `minTokens: 70` (≈50 lines)
    - `ignore: ["**/node_modules/**", "**/ios/**", "**/android/**", "**/.expo/**", "**/*.test.ts", "**/*.test.tsx"]`
    - `reporters: ["console"]`
- CI integration
  - `.github/workflows/ci.yml`
    - Append after the lint step: `npm run dead-code`, then `npm run duplication`
    - Both stages independent (fail one doesn't block the other from reporting)

## Verification

```bash
cd ios-app && npm run dead-code && npm run duplication
```

Both exit 0. Intentionally export an unused function from `src/lib/auth.ts` → knip fails. Revert → passes.

## Manual operations to configure services

None.
