---
name: refactor-page
description: Refactor an existing page to follow the WhyNot headless component pattern — splitting logic into a .hooks.ts file and keeping the .tsx file as a pure view with no tRPC calls or state.
argument-hint: <PageName>
---

## Task

Refactor `$0` to follow the WhyNot headless component pattern.

## Pattern

Complex pages in this project are split into two files:

```
pages/$0/
├── $0.tsx          # Pure view — JSX only, no tRPC calls, no useState for data
└── $0.hooks.ts     # All logic: tRPC queries/mutations, state, side-effects
```

The `.hooks.ts` file exports a single `use$0` hook. The `.tsx` file calls that hook at the top and uses its return value for rendering.

## Steps

### 1. Read the existing page
- Read `$0.tsx` in full
- Identify all tRPC calls (`trpc.*`), `useState`, `useEffect`, and other logic
- Identify what data/callbacks the view actually needs rendered

### 2. Create `$0.hooks.ts`
- Move all tRPC calls, state, and side-effects into a `use$0()` hook
- Return only what the view needs: data, loading flags, and handler functions
- Group related logic under clearly named sub-hooks if the page is large (e.g. `useChat`, `useAuction`)
- Reusable hooks go in `src/hooks/`; page-scoped hooks stay in `.hooks.ts`

### 3. Rewrite `$0.tsx`
- Call `use$0()` at the top — no other tRPC/state logic in this file
- JSX only: render based on the hook's return values
- Keep `cn()`, Lucide icons, and UI components in the view file

### 4. Verify the build
- Run `npm run build:client` from `app/`
- Fix any TypeScript errors before reporting done

## Project conventions (WhyNot / Popup)
- Frontend code: `app/client/src/`
- tRPC client: `import { trpc } from "@/lib/trpc"`
- Styling: design tokens (`bg-background`, `text-foreground`, `text-primary`), `cn()` from `@/lib/utils`
- Icons: Lucide React
- Toasts: Sonner (`toast.success(...)`, `toast.error(...)`)
