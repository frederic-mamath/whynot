# Ticket 01 — Migration DB + Types + Repositories

## Acceptance Criteria

- En tant que développeur, quand je lance la migration `031`, les tables `channels`, `channel_participants`, `channel_products` sont renommées en `lives`, `live_participants`, `live_products`.
- En tant que développeur, les colonnes `channel_id` dans `live_participants` et `live_products` sont renommées en `live_id`.
- En tant que développeur, la table `lives` dispose des nouvelles colonnes `starts_at` (NOT NULL, backfillée depuis `created_at`), `ends_at`, `session_stopped_at`, `description`.
- En tant que développeur, TypeScript compile sans erreur après ces changements.
- En tant que développeur, les anciens fichiers `ChannelRepository`, `ChannelParticipantRepository`, `ChannelProductRepository` continuent de fonctionner via des re-exports.

## Technical Strategy

- Backend
  - Migration
    - `app/migrations/031_rename_channels_to_lives.ts`
      - `up`: RENAME TABLE `channels→lives`, `channel_participants→live_participants`, `channel_products→live_products`. RENAME COLUMN `live_participants.channel_id→live_id`, `live_products.channel_id→live_id`. ADD COLUMN `starts_at` (backfillée), `ends_at`, `session_stopped_at`, `description`.
      - `down`: Inverse toutes les opérations.
  - DB Types
    - `app/src/db/types.ts`
      - `LivesTable`: Nouveau type avec `starts_at`, `ends_at`, `session_stopped_at`, `description`.
      - `LiveParticipantsTable`: Nouveau type, colonne `live_id` au lieu de `channel_id`.
      - `LiveProductsTable`: Nouveau type, colonne `live_id` au lieu de `channel_id`.
      - `Database`: Clés `lives`, `live_participants`, `live_products` remplacent les anciennes. Aliases `ChannelsTable = LivesTable` etc. pour rétrocompatibilité.
  - Repository
    - `app/src/repositories/LiveRepository.ts`
      - `findById`, `findActive`, `findByHost`, `findScheduledByHost`, `findPastByHost`, `save`, `schedule`, `start`, `endLive`, `isHost`, `isActive`, `countActiveParticipants`, `hasReachedCapacity`.
      - Export `liveRepository` + alias `channelRepository`.
    - `app/src/repositories/LiveParticipantRepository.ts`
      - Toutes les méthodes utilisent `live_participants` et `live_id`.
      - Export `liveParticipantRepository` + alias `channelParticipantRepository`.
    - `app/src/repositories/LiveProductRepository.ts`
      - Toutes les méthodes utilisent `live_products` et `live_id`.
      - Export `liveProductRepository` + alias `channelProductRepository`.
    - `app/src/repositories/ChannelRepository.ts`
      - Remplacé par un re-export depuis `LiveRepository`.
    - `app/src/repositories/ChannelParticipantRepository.ts`
      - Remplacé par un re-export depuis `LiveParticipantRepository`.
    - `app/src/repositories/ChannelProductRepository.ts`
      - Remplacé par un re-export depuis `LiveProductRepository`.
    - `app/src/repositories/index.ts`
      - Exports des nouveaux noms `live*` + aliases `channel*` pour rétrocompatibilité.
    - `app/src/repositories/ProductRepository.ts`
      - `findByChannelId()`: `innerJoin("live_products" ...)` + `.where("live_products.live_id" ...)`.
  - Router
    - `app/src/routers/channel.ts`
      - Toutes les requêtes directes `db.selectFrom("channels")` → `("lives")`, `"channel_participants"` → `"live_participants"`, etc.
    - `app/src/routers/auction.ts`
      - `isChannelHost()`: `selectFrom("lives")`.
      - Recherche du channel actif : `selectFrom("lives")`.
    - `app/src/routers/vendorPromotion.ts`
      - `innerJoin("live_products" ...)` + `.where("live_products.live_id" ...)`.
    - `app/src/services/auctionService.ts`
      - `isChannelHost()`: `selectFrom("lives")`.
      - `updateTable("lives")` à la place de `updateTable("channels")`.

## Manual operations

- Lancer la migration après déploiement : `npx tsx migrate.ts` depuis le dossier `app/`.
- Note : les tables `messages`, `auctions`, `vendor_promoted_products` conservent leur colonne `channel_id` (FK vers `lives.id`) — elles ne sont pas renommées.

## Status

completed
