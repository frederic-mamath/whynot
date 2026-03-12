# Ticket 01 — Migration DB + Types + Repository

## Acceptance Criteria

- En tant que développeur, quand je lance la migration `032`, la table `users` dispose de deux nouvelles colonnes : `avatar_url` (varchar 500, nullable) et `has_completed_onboarding` (boolean NOT NULL default false).
- En tant que développeur, les utilisateurs existants avant la migration ont `has_completed_onboarding = true` (backfill dans le `up`).
- En tant que développeur, TypeScript compile sans erreur après ces changements.

## Technical Strategy

- Backend
  - Migration
    - `app/migrations/032_add_avatar_onboarding_to_users.ts`
      - `up`: ADD COLUMN `avatar_url` varchar(500) nullable. ADD COLUMN `has_completed_onboarding` boolean NOT NULL default false. UPDATE tous les users existants avec `has_completed_onboarding = true`.
      - `down`: DROP COLUMN `has_completed_onboarding`. DROP COLUMN `avatar_url`.
  - DB Types
    - `app/src/db/types.ts`
      - `UsersTable`: Ajouter `avatar_url: string | null` et `has_completed_onboarding: Generated<boolean>`.
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `saveOAuthUser()`: Ajouter `has_completed_onboarding: false` dans les valeurs d'insertion.
      - `updateProfile()`: Étendre le type de `data` pour accepter `nickname?`, `avatar_url?`, `has_completed_onboarding?` et les inclure dans le `updateData`.

## Manual operations

- Lancer la migration après déploiement : `npx tsx migrate.ts` depuis le dossier `app/`.

## Status

completed
