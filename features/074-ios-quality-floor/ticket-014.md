# Ticket 014 — Spacing/Radius/Typography token sweep

## Goal

The recent palette migration (feature 072) replaced hex codes with `Colors.*`. The audit found ~148 hardcoded `fontSize`, plus ~25 files with hardcoded `padding`/`borderRadius` literals. R7 was added in T-003 with these files seeded as TODO exclusions.

This ticket removes those exclusions one file at a time, migrating each to `Spacing.*`, `Radius.*`, and `Typography.*` from `src/theme/tokens.ts`.

After this ticket, `ios-app/CLAUDE.md`'s "Styling" section loses its prose paragraph about hardcoded values — R7 enforces it.

## Acceptance Criteria

- As a user, the visual rhythm of spacing, padding, and font sizes is uniform across every screen
- As a developer, the `R7_EXCLUDE` set in `scripts/arch-test.mjs` is empty (only the always-excluded `src/theme/tokens.ts` remains via the dedicated check)
- As a developer, `npm run arch:test` passes with R7 enforced everywhere

## Technical Strategy

- Frontend / Token mapping (from `src/theme/tokens.ts`)
  - `Spacing` — `xs/sm/md/lg/xl/2xl/3xl` = `4/8/12/16/24/32/48`
  - `Radius` — `sm/md/lg/xl/2xl/3xl/4xl` = `6/8/10/14/18/22/26`
  - `Typography.fontSize` — `xs/sm/base/lg/xl/2xl/3xl` = `12/14/16/18/20/24/30`
  - `Typography.fontWeight` — `regular/medium/semibold/bold` = `"400"/"500"/"600"/"700"`
- Frontend / Sweep
  - Migrate each file in `R7_EXCLUDE` and remove its entry. Mechanical replacement using the mapping above.
  - For values that don't map cleanly (e.g. `fontSize: 11`, `padding: 7`), choose the closest token. Only add a new token to `design-tokens/tokens.json` if the off-grid value appears 3+ times AND has no near-neighbor.
  - High-traffic files per audit: `app/(tabs)/profile.tsx`, `app/live/[liveId].tsx`, `app/(auth)/login.tsx`, `src/components/live/ChatPanel.tsx`
- Token additions (if needed)
  - `design-tokens/tokens.json` — only if a value appears 3+ times. Postinstall codegen re-runs and updates `src/theme/tokens.ts` automatically.
- CLAUDE.md update
  - `ios-app/CLAUDE.md` — trim "Styling" section's prose about hardcoded values; reference R7 instead

## Verification

```bash
cd ios-app && npm run arch:test
```

Output ends with `Architecture checks passed (R2, R3, R4, R5, R6, R7).` and the `R7_EXCLUDE` set in `scripts/arch-test.mjs` is empty. Visual diff each migrated screen against pre-migration screenshots — no shifts.

## Manual operations to configure services

None.
