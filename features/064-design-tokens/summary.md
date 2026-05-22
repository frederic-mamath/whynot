# Shared Design Tokens — Web + Mobile

## Initial Prompt

The web app uses Tailwind v4 with semantic tokens (`bg-primary`, `text-foreground`, etc.) and feels easy to maintain. The mobile app hardcodes hex colors (`#7C3AED`, `#111827`, …) scattered across `StyleSheet.create` blocks — three problems: visual drift between platforms, painful maintenance, and missing Tailwind-style ergonomics. This feature introduces a shared design-tokens infrastructure that both platforms consume.

## Approach (locked)

- **Single source of truth**: `design-tokens/tokens.json` at the repo root. Categories: colors, spacing, radius, typography (fontFamily, fontSize, fontWeight). Dark mode out.
- **Codegen**: `design-tokens/generate.mjs` reads the JSON and writes two outputs — one per platform:
  - `app/client/src/styles/tokens.css` — Tailwind v4 `@theme` block (drives `bg-primary`, `text-foreground`, etc.)
  - `ios-app/src/theme/tokens.ts` — typed constants (`Colors.primary`, `Spacing.lg`, `Radius.md`, `Typography.fontSize.base`)
- **Generated files are gitignored**. They are produced by `npm install` (`postinstall` hook), every dev start (`predev`), every build (`prebuild:*`), and on every `app.config.ts` evaluation (so `npx expo prebuild` always sees fresh tokens). This keeps the JSON as the only place to edit and means Render deploys without any extra config — `npm install` regenerates the CSS automatically.
- **No NativeWind** (would require a new binary cycle). Mobile gets typed constants + StyleSheet ergonomics, not utility classes.
- **No visual change** — values extracted verbatim from the current web Tailwind config.
- **Migration**: mobile screens migrate piecemeal as they are touched. This feature ships the infrastructure plus 3 example migrations to lock the pattern in.

## Out of Scope

- **Dark mode / theme switching** — explicit user choice.
- **Full mobile migration** — only 3 example screens, the rest is incremental.
- **Visual redesign** — values stay byte-identical to current web; this feature is pure plumbing.
- **Animation tokens** (timings, easings, shadows, letter-spacing, line-height) — colors / spacing / radius / font (size, weight, family) only for v1.
- **NativeWind / utility classes on mobile** — explicit choice for OTA safety and stable architecture.
- **Web rebrand** — current Tailwind semantic tokens stay in place, just sourced from the new JSON.

## Tickets

| Ticket     | Description                                                                  | Status  |
| :--------- | :--------------------------------------------------------------------------- | :------ |
| ticket-001 | Create `design-tokens/` infrastructure: JSON + generator script + gitignore  | planned |
| ticket-002 | Wire web Tailwind to consume generated `tokens.css` (no visual change)      | planned |
| ticket-003 | Wire mobile to consume `tokens.ts` + migrate 3 example screens + update CLAUDE.md | planned |

## User Stories

| User Story                                                                                                       | Status  |
| :--------------------------------------------------------------------------------------------------------------- | :------ |
| As a developer, I can change a design value once in `tokens.json` and see it propagate to both web and mobile  | planned |
| As a developer working on a mobile screen, I import `Colors`/`Spacing`/`Radius`/`Typography` and stop hardcoding hex codes | planned |
| As a CI / Render build, the generator runs automatically and the deploy succeeds without extra configuration  | planned |
