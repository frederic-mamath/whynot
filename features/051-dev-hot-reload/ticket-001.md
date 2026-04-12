# Ticket 001 — Concurrent Dev Script

## Acceptance Criteria

- As a developer, when I run `npm run dev:full` from `app/`, I should see both the Express backend (port 3000) and the Vite dev server (port 5173) start in the same terminal with color-coded output
- As a developer, when I save a frontend file, the browser should hot-reload without a full page refresh (Vite HMR)
- As a developer, when I save a backend file, the server should restart automatically (tsx watch)
- As a developer, when a frontend runtime error occurs, the stack trace should reference original source file names and line numbers

## Technical Strategy

- Frontend / Config
  - `app/package.json`
    - Add `concurrently` to `devDependencies`: `"concurrently": "^9.x"`
    - Add script: `"dev:full": "concurrently --names \"api,web\" --prefix-colors \"blue,green\" \"npm run dev:watch\" \"npx vite\""`

## Architecture note

No code changes required. The proxy (`/trpc`) and CORS (`localhost:5173`) are already configured in:
- `app/vite.config.ts` — `server.proxy`
- `app/src/index.ts` — `CORS_ORIGIN` env var (defaults to `http://localhost:5173`)

Access the app at `http://localhost:5173` (not `:3000`) during development.

### Manual operations to configure services

- None
