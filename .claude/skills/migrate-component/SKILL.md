---
name: migrate-component
description: Migrate all usages of an old component to a new one across the codebase. Handles import path changes, prop/API differences, and verifies the build compiles with zero errors.
argument-hint: <OldComponent> <NewComponent> [api-changes]
---

## Task

Migrate every usage of `$0` to `$1` across the entire codebase.

Additional context / API changes: $ARGUMENTS

## Steps

### 1. Discover
- Use Grep to find every file that imports `$0`
- For each file, read the relevant section to understand how `$0` is used (props, event handlers, className, etc.)
- Build a complete list of files to change before touching anything

### 2. Understand the new API
- Read the new component `$1` to understand its props interface
- Map old props → new props (e.g. `onChange={(e) => fn(e.target.value)}` → `onChange={(v) => fn(v)}`, `className` → `inputClassName` for native-input styling, etc.)
- Identify any imports that must change (e.g. deprecated named export → default export)

### 3. Migrate all files
For each file discovered in step 1:
- Update the import path to point to the new component
- Rewrite any prop/handler differences to match the new API
- Remove any props that no longer exist
- Prefer the smallest diff possible — only change what needs to change

### 4. Delete the old file (if applicable)
If `$0` is being permanently replaced and no longer needed, delete it.

### 5. Verify the build
- Run `npm run build:client` from `app/`
- If there are TypeScript errors, fix them before reporting done
- Run `npm run build:server` if server-side files were touched

## Project conventions (WhyNot / Popup)
- All frontend code is in `app/client/src/`
- Custom `Input` component: `@/components/ui/Input/Input` (default export, `onChange: (value: string) => void`)
- Use `cn()` from `@/lib/utils` for conditional classes
- Design tokens over raw Tailwind colors (`bg-background`, `text-foreground`, `text-primary`, etc.)
- Import aliases: `@/` = `app/client/src/`
