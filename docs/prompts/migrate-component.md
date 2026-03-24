# `/migrate-component` — Prompt Guide

Skill: `.claude/skills/migrate-component/SKILL.md`
Usage: `/migrate-component <OldComponent> <NewComponent> [api-changes]`

---

## How to write an effective prompt

The skill works best when you spell out **every prop mapping explicitly** in the arguments. This eliminates the discovery phase where Claude has to infer the API diff from reading both components — which is where most of the unnecessary file reads come from.

Provide:
1. The old import path(s) — including named vs. default export differences
2. The new import path
3. A line-by-line prop mapping (old prop → new prop or className equivalent)
4. Any props to delete entirely
5. Whether to delete the old file after migration

---

## Example — `Button` → `ButtonV2`

```
/migrate-component button.tsx ButtonV2

Old component: `@/components/ui/button` (named export `{ Button }` or default)
New component: `@/components/ui/ButtonV2/ButtonV2` (default export only)

API mapping:
- Import: `import { Button } from "…/button"` or `import Button from "…/button"`
  → `import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2"`

- `<Button>Label text</Button>` (children)
  → `<ButtonV2 label="Label text" />`

- `<Button><Icon /> Label</Button>` (icon + text children)
  → `<ButtonV2 icon={<Icon />} label="Label" />`

- `variant="default"` → `className="bg-primary text-primary-foreground"`
- `variant="destructive"` → `className="bg-destructive text-white"`
- `variant="outline"` → `className="border border-border bg-background text-foreground"`
- `variant="secondary"` → `className="bg-secondary text-secondary-foreground"`
- `variant="ghost"` → `className="bg-transparent text-foreground"`
- `variant="link"` → `className="text-primary underline-offset-4 underline"`
- `size` prop → remove it; adjust padding via className if the callsite needs a non-default size
- `asChild` prop → remove it; use the `href` prop on ButtonV2 if the button was wrapping a link
- `onClick`, `type`, `disabled`, `className` → keep as-is, same prop names

After migrating all usages, delete `app/client/src/components/ui/button.tsx`.
Run `npm run build:client` from `app/` and fix any errors before finishing.
```

---

## Template for future migrations

```
/migrate-component <OldFile> <NewComponent>

Old component: `<old import path>` (<named | default> export)
New component: `<new import path>` (<named | default> export)

API mapping:
- Import: `import … from "…/old"` → `import … from "…/new"`
- `<old prop>` → `<new prop or className>`
- `<old prop>` → remove (reason)
- `<unchanged props>` → keep as-is

After migrating all usages, delete `<old file path>`.
Run `npm run build:client` from `app/` and fix any errors before finishing.
```
