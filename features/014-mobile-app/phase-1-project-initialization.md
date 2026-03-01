# Phase 1: Project Initialization & Configuration

## Objective

Set up the Expo project in `mobile-app/`, configure react-native-unistyles v3 with design tokens matching the web app, install core dependencies, configure EAS for builds, and validate with a working Dev Client.

## User-Facing Changes

No user-facing changes — this is infrastructure setup. After this phase, the app renders a placeholder screen on a Dev Client or emulator.

## Files to Update

### Frontend (mobile-app/)

- `app.json` — Expo configuration (name, slug, bundle ID, permissions)
- `package.json` — Dependencies
- `tsconfig.json` — TypeScript config with path aliases
- `src/lib/theme.ts` — Design tokens (colors, spacing, radii) for light/dark themes
- `src/lib/unistyles.ts` — Unistyles configuration (themes + breakpoints)
- `eas.json` — EAS Build profiles (development, preview, production)
- `app/_layout.tsx` — Root layout (placeholder)
- `app/index.tsx` — Home screen (placeholder)
- `.env.example` — Environment variables template
- `.gitignore` — Expo/RN specific ignores

### Backend

- None

### Shared

- Root `.gitignore` — Add `mobile-app/` specific entries if needed

## Steps

1. Create Expo project via `npx create-expo-app@latest`
2. Install core dependencies: `expo-secure-store`, `expo-constants`, `expo-status-bar`
3. Install react-native-unistyles and configure with project design tokens
4. Configure TypeScript with `@/` path aliases
5. Create source directory structure (`src/components/`, `src/hooks/`, `src/lib/`, `src/types/server/`, `src/utils/`, `scripts/`)
6. Configure `app.json` with app identity (`fr.mamath.whynot`), permissions, scheme
7. Create `.env.example` with required variables
8. Install and configure EAS CLI, create `eas.json` with build profiles
9. Validate: `npx expo start` launches without errors

## Design Considerations

- Unistyles v3 uses enhanced `StyleSheet.create()` with theming callback `(theme) => ({...})`
- Design tokens (colors, spacing, radii) extracted from web app's `index.css` (oklch → hex)
- Path alias `@/` maps to `./src/` for clean imports
- Expo Router uses the `app/` directory for file-based routing (separate from `src/`)
- The `mobile-app/` directory is fully independent — no npm workspaces

## Acceptance Criteria

- [ ] `mobile-app/` directory exists at repo root with valid Expo project
- [ ] `npx expo start` runs without errors
- [ ] Unistyles configured with light/dark themes and a styled placeholder screen renders
- [ ] TypeScript compiles with `@/` alias working
- [ ] `eas.json` present with development/preview/production profiles
- [ ] `.env.example` documents all required environment variables
- [ ] Source directory structure created (`src/components/`, `src/hooks/`, etc.)

## Testing Checklist

- [ ] `npx expo start` launches the dev server
- [ ] Metro bundler resolves `@/` imports
- [ ] Unistyles theme colors render correctly on placeholder screen
- [ ] `npx expo lint` passes (if configured)

## Status

⏳ IN PROGRESS
