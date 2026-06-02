# Ticket 001 — Palette swap + system surfaces + docs

## Goal

Replace the iOS mobile palette in `design-tokens/tokens.json` with the web-aligned dark palette (table in `summary.md`). Regenerate `ios-app/src/theme/tokens.ts`. Lock iOS into dark mode at the OS level so status bar text, modal sheets, and the splash screen all render dark. Update CLAUDE.md guidance so future contributors know the primary is now lime-yellow, not purple.

After this ticket the app builds and launches into a dark shell. Individual screens may still have visual bugs — those are fixed in tickets 002–004.

## Acceptance Criteria

- As a user, when I cold-launch the app, I see a near-black splash screen (no white flash)
- As a user, when I open the app, the iOS status bar shows light icons (because the underlying surface is dark)
- As a developer, `Colors.primary` resolves to `#E0FF00` (lime) in `ios-app/src/theme/tokens.ts`
- As a developer, `Colors.background` resolves to `#0D0D0D`
- As a developer, every key in the existing `Colors` export still exists in the regenerated file (no key removed)
- `npx tsc --noEmit` passes with zero errors from `ios-app/`
- `npm run arch:test` passes (R2, R3, R4) — no new hex codes leaked into source files
- `npx expo prebuild --clean` completes without errors

## Technical Strategy

- Tokens — `design-tokens/tokens.json` (modify, `colors.mobile` section)
  - Replace each key per the mapping table in `summary.md`. The web `colors.web` section is untouched.

- Regenerate — from the repo root:
  ```bash
  node design-tokens/generate.mjs
  ```
  This rewrites `ios-app/src/theme/tokens.ts` (and `app/client/src/styles/tokens.css`, but web tokens aren't changing so that file should remain byte-identical).

- System surfaces — `ios-app/app.config.ts` (modify)
  - Change `splash.backgroundColor` from `"#ffffff"` to `"#0D0D0D"`
  - Change top-level `userInterfaceStyle` from `"automatic"` to `"dark"` so the iOS status bar, action sheets, alerts, and native pickers (date picker, image picker chrome) render dark even before any JS runs

- StatusBar — `ios-app/app/_layout.tsx` (modify)
  - Add `<StatusBar style="light" />` from `expo-status-bar` at the top of the rendered tree (next to the existing PostHogProvider wrap), so the text/icons in the status bar are light. The `expo-status-bar` package is already a transitive dep via expo — verify with `grep expo-status-bar ios-app/package.json` before importing; if not in deps, `npm install expo-status-bar`.

- Documentation — `ios-app/CLAUDE.md` (modify, "Styling" section)
  - Replace any "purple primary" wording with "lime-yellow primary (`#E0FF00`)"
  - Add a sentence: "The iOS app is dark-only — `userInterfaceStyle: 'dark'` is locked at the config level. Don't introduce a light-mode toggle without product discussion."

- Splash asset — `ios-app/assets/images/splash-icon.png` (do not modify)
  - The splash image will now show against `#0D0D0D` instead of white. If the splash icon was designed for a white background, it may look wrong. **Acceptance check**: run the app in a simulator and visually confirm the splash doesn't have a white halo around the icon. If it does, this is a manual asset-replacement task — flag in the report, do not block this ticket on it.

## Verification

```bash
cd ios-app
npx tsc --noEmit
npm run arch:test
npx expo prebuild --clean 2>&1 | tail -20
```

Manual:
1. `npx expo run:ios` (or `--device`) — cold-launch the app on simulator
2. Splash should be dark, not white
3. Status bar text should be light (visible on the dark background)
4. Navigate to one screen (e.g. login) — the layout works but specific elements likely look wrong; that's expected, tickets 002+ fix per-screen

## Manual operations to configure services

- **Splash icon asset**: if visually broken after the bg change, replace `ios-app/assets/images/splash-icon.png` with a version designed for a dark background. Out of ticket scope.
- **App Store screenshots**: the current screenshots show the old purple identity. Schedule a re-shoot before the next App Store submission. Tracked in `summary.md` "Explicitly out of scope".
