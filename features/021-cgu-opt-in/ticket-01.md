# Ticket 01 — Migration DB + mise à jour backend

## Acceptance Criteria

- En tant que développeur, quand je lance la migration, la colonne `accepted_cgu_at` (TIMESTAMP NULLABLE) est créée dans la table `users`.
- En tant qu'utilisateur, quand je m'inscris, la date d'acceptation des CGU est enregistrée en base de données.
- En tant que développeur, si j'appelle le endpoint `register` sans `acceptedCgu: true`, le serveur retourne une erreur de validation.

## Technical Strategy

- Backend
  - Migration
    - `app/migrations/030_add_accepted_cgu_at_to_users.ts`
      - `up`: Ajoute la colonne `accepted_cgu_at TIMESTAMP` nullable à la table `users`.
      - `down`: Supprime la colonne `accepted_cgu_at`.
  - DB Types
    - `app/src/db/types.ts`
      - `UsersTable`: Ajoute `accepted_cgu_at: Date | null` après `is_verified`.
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `save()`: Ajoute le paramètre `acceptedCguAt?: Date` et l'insère dans la requête Kysely.
      - `saveOAuthUser()`: Insère `accepted_cgu_at: null` (pas d'opt-in explicite pour OAuth).
  - Mapper
    - `app/src/mappers/user.mapper.ts`
      - `mapCreateUserInboundDtoToUser()`: Ajoute `accepted_cgu_at: null` dans l'objet retourné.
  - Router
    - `app/src/routers/auth.ts`
      - `register` input schema: Ajoute `acceptedCgu: z.literal(true)` pour rendre l'opt-in obligatoire côté validation.
      - `register` mutation body: Passe `new Date()` comme `acceptedCguAt` à `userRepository.save()`.

## Manual operations

- Aucune opération manuelle sur des services tiers.
- Lancer la migration après le déploiement : `npx tsx migrate.ts` depuis le dossier `app/`.

## Status

completed
