# Ticket 01 — Database: password_reset_tokens table + repository

### Acceptance Criteria

- As a developer, when I run migrations, the `password_reset_tokens` table is created with columns: `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`
- As a developer, I can use `PasswordResetTokenRepository` to create, find, and invalidate reset tokens

### Technical Strategy

- Backend
  - Migration
    - `app/migrations/025_create_password_reset_tokens.ts` (adjust number to next available)
      - Create `password_reset_tokens` table:
        - `id` SERIAL PRIMARY KEY
        - `user_id` INTEGER NOT NULL REFERENCES users(id)
        - `token_hash` VARCHAR(255) NOT NULL — stores bcrypt hash of the token (never store plaintext)
        - `expires_at` TIMESTAMP NOT NULL
        - `used_at` TIMESTAMP NULL — set when token is consumed
        - `created_at` TIMESTAMP DEFAULT NOW()
      - Add index on `user_id`
  - Database Types
    - `app/src/db/types.ts`
      - Add `PasswordResetTokensTable` interface
      - Add to `Database` interface
  - Repository
    - `app/src/repositories/PasswordResetTokenRepository.ts`
      - `save(userId, tokenHash, expiresAt)`: Insert a new reset token row
      - `findValidByTokenHash(tokenHash)`: Find token where `used_at IS NULL` and `expires_at > NOW()`
      - `markAsUsed(tokenId)`: Set `used_at = NOW()`
      - `deleteExpiredByUserId(userId)`: Clean up old tokens for a user before creating a new one

### Manual operations to configure services

None.
