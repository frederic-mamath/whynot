# Feature 051 — Dev Hot Reload

## Initial Prompt

> When developing, frontend errors show minified stack traces because `npm run dev` runs a production build. How can I run backend and frontend with hot reloading? Is it possible? How hard is it to maintain?

---

## Context

The current `npm run dev` script runs `npm run build && node dist/index.js`, meaning the frontend is always minified in local development. This makes debugging impossible (minified stack traces, no HMR).

The Vite config already has a dev proxy (`/trpc → localhost:3000`) and Express already whitelists `localhost:5173` for CORS — the infrastructure is in place. The only missing piece is a convenience script that starts both processes concurrently.

---

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a developer, when I run a single command, I should have both the backend (hot reload via tsx) and the frontend (HMR via Vite) running simultaneously | planned |
| As a developer, when a frontend error occurs, I should see a readable stack trace with original file names and line numbers | planned |
