# Ticket 001 — Backend: nextScheduled live query

## Acceptance Criteria

- As a user, when the app calls `trpc.live.nextScheduled`, it receives the next live scheduled globally (across all vendors), with host info (nickname, avatarUrl) and top categories

## Technical Strategy

- Backend
  - Repository
    - `app/src/repositories/LiveRepository.ts`
      - `findNextScheduled()`: query `lives` JOIN `users` for host info, WHERE `status = 'scheduled'` AND `starts_at > now()`, ORDER BY `starts_at ASC`, LIMIT 1
  - Router
    - `app/src/routers/live.ts`
      - `nextScheduled`: `publicProcedure` query — calls `liveRepository.findNextScheduled()`, fetches host user info, returns shaped response or null

## Manual operations to configure services

- None
