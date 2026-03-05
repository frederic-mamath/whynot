# Ticket 01 — Migration DB: auth_providers table + password nullable

### Acceptance Criteria

- As a developer, when I run migrations, the `auth_providers` table is created with columns: id, user_id (FK), provider, provider_user_id, provider_email, created_at
- As a developer, the `auth_providers` table has a unique index on (provider, provider_user_id) and an index on user_id
- As a developer, the `users.password` column accepts NULL values
- As a developer, existing users with passwords are not affected by the migration
- As a developer, the TypeScript types in `db/types.ts` reflect the new schema

### Technical Strategy

- Backend
  - Migration
    - `app/migrations/022_create_auth_providers.ts`
      - `up`: Create `auth_providers` table with id (serial PK), user_id (integer FK → users.id ON DELETE CASCADE), provider (varchar), provider_user_id (varchar), provider_email (varchar), created_at (timestamp default now()). Add unique index on (provider, provider_user_id). Add index on user_id.
      - `down`: Drop `auth_providers` table.
    - `app/migrations/023_make_password_nullable.ts`
      - `up`: ALTER TABLE users ALTER COLUMN password DROP NOT NULL
      - `down`: ALTER TABLE users ALTER COLUMN password SET NOT NULL
  - Types
    - `app/src/db/types.ts`
      - Add `AuthProvidersTable` interface
      - Update `UsersTable.password` to `string | null`
      - Add `auth_providers: AuthProvidersTable` to `Database` interface
      - Add `AuthProvider` type alias

### Manual operations to configure services

- None
