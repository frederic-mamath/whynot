# Ticket 001 — Backend: cover_url on lives table

## Acceptance Criteria

- As a seller, when I schedule a live with a cover image, the URL is persisted and returned by the live query
- As a user, the homepage highlight block receives the `coverUrl` from `trpc.live.nextScheduled`

## Technical Strategy

- Backend
  - Migration
    - `app/migrations/034_add_cover_url_to_lives.ts`
      - Add column `cover_url VARCHAR(500) NULL` to `lives` table
  - Type
    - `app/src/db/types.ts`
      - Add `cover_url: string | null` to `LivesTable`
  - Repository
    - `app/src/repositories/LiveRepository.ts`
      - `schedule()`: accept `cover_url` in data, write it
      - `update()`: accept `cover_url` in data, write it
      - `findNextScheduled()`: include `lives.cover_url` in SELECT
  - Router
    - `app/src/routers/live.ts`
      - `schedule` mutation: add `coverUrl: z.string().url().optional()`
      - `update` mutation: add `coverUrl: z.string().url().optional().nullable()`
      - `nextScheduled` query: include `coverUrl` in returned object

## Manual operations to configure services

- None (Cloudinary already configured)
