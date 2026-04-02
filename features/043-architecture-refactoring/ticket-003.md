# Ticket 003 — DB: add missing index on channel_participants.user_id

## Acceptance Criteria

- As a developer, lookups by `user_id` on `channel_participants` should use an index instead of a full table scan

## Technical Strategy

- Database
  - Migration
    - `app/migrations/041_add_participant_user_id_index.ts` *(new)*
      - `up`: `CREATE INDEX channel_participants_user_id_idx ON channel_participants (user_id)`
      - `down`: `DROP INDEX channel_participants_user_id_idx`

## Notes

The `seller_onboarding_data` table was initially flagged as missing a migration, but it is correctly created in `036_add_seller_onboarding.ts`. No action needed there.
