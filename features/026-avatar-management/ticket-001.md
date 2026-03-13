# Ticket 001 — Backend: store avatar_public_id + updateAvatar endpoint

## Acceptance Criteria

- As a user, in the profile page, when I upload a new avatar, my old avatar is deleted from Cloudinary and my new avatar URL is saved
- As a user, when I call `profile.me`, I receive my current `avatarUrl` (already works)

## Technical Strategy

- Backend
  - Migration
    - `app/migrations/033_add_avatar_public_id_to_users.ts`
      - Add column `avatar_public_id VARCHAR(255) NULL` to `users` table
  - Type
    - `app/src/db/types.ts`
      - Add `avatar_public_id: string | null` to `UsersTable`
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `updateProfile`: add `avatar_public_id` to accepted fields and update logic
  - Router
    - `app/src/routers/profile.ts`
      - Add `updateAvatar` mutation:
        - Input: `{ avatarUrl: string (url), avatarPublicId: string }`
        - Read current user's `avatar_public_id` from DB
        - If exists → call `cloudinaryService.deleteImage(oldPublicId)` to remove old image
        - Save `avatar_url` + `avatar_public_id` via `userRepository.updateProfile`
        - Return `{ success: true }`

## Manual operations to configure services

- None (Cloudinary already configured, `CLOUDINARY_*` env vars already set)
