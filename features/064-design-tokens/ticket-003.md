# ticket-003 — Wire mobile `tokens.ts` + migrate 3 example screens + update CLAUDE.md

## Goal

After this ticket, the mobile app has typed design constants available everywhere, three example screens are migrated as a pattern reference, and the iOS CLAUDE.md prohibits new hex codes. Future mobile development uses `Colors.primary` instead of `"#7C3AED"`. The rest of the codebase migrates incrementally as files are touched.

## Acceptance Criteria

- As a developer, `ios-app/package.json` declares a `postinstall` script that runs `node ../design-tokens/generate.mjs` — so `tokens.ts` exists after every `npm install` (including CI / EAS Build)
- As a developer, `ios-app/app.config.ts` invokes the generator at config-load time (via `execSync` at module top) — so `npx expo prebuild --clean`, `npx expo run:ios`, and `npx expo start` always see a fresh `tokens.ts`
- As a buyer on iOS, in the Profile screen, the visual result is **identical** to before — same colors, spacing, radii, fonts
- As a buyer on iOS, in the Address list screen (`/address`), same — no visual change
- As a buyer on iOS, in the Welcome screen (`/(auth)/welcome`), same
- As a developer, opening any of the three migrated files shows **zero hard-coded hex strings** in `StyleSheet.create` — only `Colors.*`, `Spacing.*`, `Radius.*`, `Typography.*`
- As a developer, `ios-app/CLAUDE.md` Conventions section is updated: hex colors disallowed, all styling must come from `src/theme/tokens.ts`
- As a developer, `npx tsc --noEmit` passes; `npx expo prebuild --clean` succeeds

## Technical Strategy

- iOS App (`ios-app/`)
  - Build pipeline
    - `ios-app/package.json`
      - Add `"postinstall": "node ../design-tokens/generate.mjs"` to the scripts block
    - `ios-app/app.config.ts`
      - At the top of the file (after imports, before the default export), add a one-liner side-effect: `execSync("node " + path.resolve(__dirname, "../design-tokens/generate.mjs"))` (with appropriate imports from `node:child_process` and `node:path`). Wrap in `try/catch` and log warnings on failure — never throw, since blocking config load over a tokens issue is worse than a stale tokens file.
  - Sample screen migrations
    - `ios-app/app/(tabs)/profile.tsx`
      - Replace all hex strings in the `StyleSheet.create` block with `Colors.*`
      - Replace numeric padding/margin/borderRadius values with `Spacing.*` / `Radius.*` where they semantically match (e.g. `padding: 16` → `padding: Spacing.lg`)
      - Replace `fontSize: 28` etc. with `Typography.fontSize.*` where semantically right
      - **Do NOT change the visual output** — token values are chosen to match
    - `ios-app/app/address/index.tsx`
      - Same pattern
    - `ios-app/app/(auth)/welcome.tsx`
      - Same pattern
  - Conventions update
    - `ios-app/CLAUDE.md`
      - Replace the existing "Styling: `StyleSheet.create` only. No Tailwind, no semantic tokens. Hex colors inline" line in the **Conventions** section with:
        > **Styling**: `StyleSheet.create` only. Colors / spacing / radius / typography **must** come from `src/theme/tokens.ts`. Do not introduce new hex codes — if a value isn't already in `tokens.ts`, add it to `design-tokens/tokens.json` at the repo root and let the codegen update both platforms.
      - Update the **What NOT to do** section: replace any references to the old hex-allowed rule

## Verification

```bash
cd ios-app
npm install           # confirm postinstall regenerates tokens.ts
npx tsc --noEmit      # zero errors
npx expo prebuild --clean   # confirm app.config.ts runs the generator
```

Then on the simulator: navigate to the three migrated screens and confirm zero visual regression vs. the prior build.

## Out of Scope

- Migrating every other mobile screen — those happen piecemeal as files are touched (low-priority opportunistic cleanup)
- Adding new token values — the JSON ships with the current set; new additions are their own future PRs
- Web wiring (ticket-002)
