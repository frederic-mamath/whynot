# Ticket 001 — GitHub Actions CI (typecheck + arch:test)

## Goal

Stand up a GitHub Actions workflow that runs on every pull request touching `ios-app/`. Execute the existing correctness gates — `npx tsc --noEmit` and `npm run arch:test` — so no PR can merge with a TypeScript error or an architecture-rule violation.

This ticket creates the pipeline. ESLint (T-002), R7/R8/R9 (T-003), knip + jscpd (T-004) are added as later stages in their respective tickets.

## Acceptance Criteria

- As a developer, when I open a PR touching `ios-app/`, the CI workflow runs automatically
- As a developer, the CI fails red if `npx tsc --noEmit` errors
- As a developer, the CI fails red if `npm run arch:test` reports a violation
- As a developer, the CI completes in under 3 minutes on a warm cache
- As a developer, when CI passes, I see a green check on the PR

## Technical Strategy

- Frontend / Tooling
  - `.github/workflows/ci.yml`
    - Trigger: `pull_request` on `main` + `push` on `main`
    - Path filter: `ios-app/**`, `scripts/arch-test.mjs`, `.github/workflows/ci.yml`
    - Job `ios-app-checks`:
      - `actions/checkout@v4`
      - `actions/setup-node@v4` with `node-version: 20` and `cache: npm` (cache key on `ios-app/package-lock.json`)
      - `npm ci` (working directory `ios-app/`)
      - `npx tsc --noEmit`
      - `npm run arch:test`
    - `defaults.run.working-directory: ios-app`
  - `ios-app/package.json` — confirm `arch:test` script exists (it does)
- Repo configuration (manual)
  - Branch protection on `main`: require `ios-app-checks` status check before merge

## Verification

```bash
# Local sanity
cd ios-app && npx tsc --noEmit && npm run arch:test
```

Open a throwaway PR with an intentional TS error → CI fails red. Revert → CI passes green.

## Manual operations to configure services

- **GitHub** — Repo Settings → Branches → Add rule for `main` → require status checks to pass before merging → select `ios-app-checks`. Docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule
