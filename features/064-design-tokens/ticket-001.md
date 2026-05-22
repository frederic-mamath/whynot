# ticket-001 — Create `design-tokens/` infrastructure: JSON + generator + gitignore

## Goal

Set up the source of truth and the codegen script. After this ticket, running `node design-tokens/generate.mjs` from the repo root produces both output files. No consumers wired up yet — that's tickets 002 (web) and 003 (mobile).

## Acceptance Criteria

- As a developer, `design-tokens/tokens.json` exists at the repo root and contains all current Tailwind semantic values (colors), plus spacing / radius / typography categories with sensible defaults
- As a developer, `design-tokens/generate.mjs` is a self-contained ESM Node script (no `package.json`, no npm deps — uses only `fs`/`path` from node built-ins) that reads the JSON and writes `app/client/src/styles/tokens.css` + `ios-app/src/theme/tokens.ts`
- As a developer, the generator validates the input — missing required keys or malformed JSON cause `process.exit(1)` with a clear error message (no silent partial outputs)
- As a developer, the two generated files are gitignored (added to repo-root `.gitignore`)
- As a developer, running `node design-tokens/generate.mjs` from the repo root produces the two files cleanly; running it twice is idempotent (same output)
- As a developer, both `npm run build:client` (in `app/`) and `npx tsc --noEmit` (in `ios-app/`) **continue to pass without consuming the new files** (because the files exist on disk but no source code imports them yet — this ticket is additive only)

## Technical Strategy

- Repo root
  - Files *(create)*
    - `design-tokens/tokens.json` — canonical source
      ```jsonc
      {
        "colors": {
          "primary": "#7C3AED",
          "primary-foreground": "#FFFFFF",
          "background": "#FFFFFF",
          "foreground": "#111827",
          "muted": "#6B7280",
          "muted-foreground": "#9CA3AF",
          "card": "#F9FAFB",
          "border": "#E5E7EB",
          "input": "#F9FAFB",
          "accent": "#EDE9FE",
          "accent-foreground": "#7C3AED",
          "destructive": "#EF4444",
          "destructive-foreground": "#FFFFFF",
          "success": "#10B981",
          "warning": "#F59E0B",
          "info": "#3B82F6"
        },
        "spacing": {
          "xs": 4, "sm": 8, "md": 12, "lg": 16, "xl": 24, "2xl": 32, "3xl": 48
        },
        "radius": {
          "sm": 6, "md": 10, "lg": 14, "xl": 20, "full": 9999
        },
        "typography": {
          "fontFamily": { "heading": "Outfit", "body": "Syne" },
          "fontSize": { "xs": 12, "sm": 13, "base": 15, "md": 16, "lg": 18, "xl": 22, "2xl": 28, "3xl": 32 },
          "fontWeight": { "regular": "400", "medium": "500", "semibold": "600", "bold": "700" }
        }
      }
      ```
      **Important**: before merging this ticket, the dev must inspect the current web's existing semantic token values (likely in `app/client/src/index.css` or the Tailwind config) and replace the placeholders above with the **exact existing values** — this feature ships zero visual change.
    - `design-tokens/generate.mjs` — generator script (~80 lines)
      - Read `tokens.json` via `node:fs/promises`
      - Validate top-level keys `colors`, `spacing`, `radius`, `typography` exist — if not, `process.exit(1)` with `"design-tokens: missing required category '<key>'"`
      - Validate all color values match `/^#[0-9A-Fa-f]{6}$/`; fail loud otherwise
      - Emit `app/client/src/styles/tokens.css`:
        ```css
        /* AUTO-GENERATED — do not edit. Source: design-tokens/tokens.json */
        @theme {
          --color-primary: #7C3AED;
          --color-foreground: #111827;
          /* ... */
          --spacing-xs: 4px;
          /* ... */
          --radius-md: 10px;
          /* ... */
          --font-heading: Outfit, ui-sans-serif, system-ui, sans-serif;
          /* ... */
          --text-base: 15px;
          /* ... */
        }
        ```
        Tailwind v4 picks up the `@theme` block and auto-generates the utility classes (`bg-primary`, `text-foreground`, `rounded-md`, `text-base`, etc.).
      - Emit `ios-app/src/theme/tokens.ts`:
        ```ts
        // AUTO-GENERATED — do not edit. Source: design-tokens/tokens.json
        export const Colors = {
          primary: "#7C3AED",
          foreground: "#111827",
          /* ... */
        } as const;
        export const Spacing = { xs: 4, sm: 8, /* ... */ } as const;
        export const Radius = { sm: 6, md: 10, /* ... */ } as const;
        export const Typography = {
          fontFamily: { heading: "Outfit", body: "Syne" },
          fontSize: { xs: 12, sm: 13, base: 15, /* ... */ },
          fontWeight: { regular: "400" as const, medium: "500" as const, /* ... */ },
        } as const;
        ```
        - Color keys that contain `-` (e.g. `primary-foreground`) become `primaryForeground` in TS (camelCase) — both web/CSS and mobile/TS have the same logical names, just different conventions.
  - Gitignore
    - `/.gitignore` (or whichever `.gitignore` is appropriate)
      - Add `app/client/src/styles/tokens.css`
      - Add `ios-app/src/theme/tokens.ts`

## Verification

```bash
node design-tokens/generate.mjs
ls -la app/client/src/styles/tokens.css ios-app/src/theme/tokens.ts
node design-tokens/generate.mjs   # second run should be byte-identical
```

Then confirm the wider builds still pass (they will, because no consumer is wired up yet):

```bash
cd app && npm run build:client
cd ios-app && npx tsc --noEmit
```

## Out of Scope

- Wiring the generated CSS into web's `index.css` (ticket-002)
- Wiring the generated TS into any mobile screen (ticket-003)
- Adding `postinstall` / `predev` / `prebuild` hooks (ticket-002 and ticket-003)
- Any visual changes
