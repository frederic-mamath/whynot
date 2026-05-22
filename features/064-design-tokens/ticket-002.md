# ticket-002 — Wire web Tailwind to consume generated `tokens.css`

## Goal

After this ticket, every web build / dev start regenerates the CSS from `design-tokens/tokens.json` and Tailwind picks up its semantic tokens from there. The site looks **identical** to before — this is pure plumbing.

## Acceptance Criteria

- As a developer, `app/package.json` declares lifecycle scripts that regenerate `tokens.css` automatically:
  - `postinstall` — after `npm install` (so Render's first build has the file)
  - `predev` — before `npm run dev`
  - `prebuild:client` — before `npm run build:client`
  - `prebuild:server` — before `npm run build:server`
- As a developer, `app/client/src/index.css` (or whichever file currently defines the Tailwind `@theme`) imports the generated `tokens.css` instead of declaring the values inline
- As a developer, after `npm run build:client`, no Tailwind semantic class fails to compile (`bg-primary`, `text-foreground`, etc. all resolve)
- As a buyer / seller browsing the production-built site, **all pages look exactly the same** as before — home, live, profile, orders, seller dashboard. Manual visual regression check on each.
- As a developer, deploying to Render via `git push` succeeds with no Render-side configuration changes — `npm install` triggers the postinstall hook automatically

## Technical Strategy

- Web App (`app/`)
  - Build pipeline
    - `app/package.json`
      - Add the four lifecycle hooks listed above, each running `node ../design-tokens/generate.mjs`
  - Stylesheet wiring
    - `app/client/src/index.css` (or the file currently containing the `@theme` block — verify by `grep "@theme" app/client/src/`)
      - Replace the inline `@theme { ... }` block with `@import "./styles/tokens.css";` (the path the generator writes to)
      - Keep any non-token CSS (resets, base styles, custom components) untouched
  - **Before merging**: confirm `design-tokens/tokens.json` (from ticket-001) holds the **exact same hex values and font sizes** as the current inline theme block. Any mismatch = visual regression — patch the JSON to match.

## Manual operations

### Pre-merge visual regression check

After running `npm run dev` on this branch:

1. Compare side-by-side against `main` (a second browser window / `git worktree`)
2. Pages to check (at minimum): `/`, `/lives`, a `/live/:id` page with an active stream, `/profile`, `/my-orders`, seller `/seller/shop`
3. Use a pixel-diff tool (or just careful visual comparison) — primary colors, button styles, borders, card backgrounds, badge backgrounds, text colors should all be identical
4. Any drift = a value in `tokens.json` doesn't match the original inline theme — patch the JSON, not the consuming code

### Render deploy verification

Push to a deploy branch, watch Render's build log — confirm:
- `npm install` log shows `> postinstall` running the generator
- The build succeeds and the deployed site renders correctly

## Out of Scope

- Mobile token wiring (ticket-003)
- Any change to the Tailwind config beyond removing the inline theme and importing the generated CSS
- New visual tokens or rebrand work — pure refactor
