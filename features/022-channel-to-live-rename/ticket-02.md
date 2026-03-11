# Ticket 02 — Routeur backend `live.ts`

## Acceptance Criteria

- En tant que vendeur, quand j'appelle `trpc.live.schedule`, un live avec `status='scheduled'` est créé en base avec `starts_at`, `ends_at` et `description`.
- En tant que vendeur, quand j'appelle `trpc.live.start`, le live passe à `status='active'` et je reçois un token Agora valide.
- En tant que vendeur, quand j'appelle `trpc.live.listByHost`, je reçois `{ upcoming: Live[], past: Live[] }`.
- En tant que développeur, `trpc.live.*` couvre toutes les procédures de l'ancien `trpc.channel.*` (create, join, list, get, participants, end, leave, highlightProduct, unhighlightProduct, getHighlightedProduct, subscribeToEvents).
- En tant que développeur, TypeScript compile sans erreur.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/live.ts` _(créé)_
      - `schedule`: Input `{ name, description?, startsAt, endsAt? }`. Vérifie auth + shop. Appelle `liveRepository.schedule()`. Retourne `{ live }`.
      - `start`: Input `{ liveId }`. Vérifie auth + host + statut non terminé. Appelle `liveRepository.start()` + `liveParticipantRepository.addParticipant()`. Génère token Agora. Retourne `{ live, token, appId, uid, isHost }`.
      - `listByHost`: Input optionnel `{ hostId? }`. Appelle `liveRepository.findScheduledByHost()` + `findPastByHost()` en parallèle. Retourne `{ upcoming, past }`.
      - `create`, `join`, `list`, `get`, `participants`, `end`, `leave`, `highlightProduct`, `unhighlightProduct`, `getHighlightedProduct`, `subscribeToEvents` : reprise de la logique de l'ancien `channel.ts` avec les nouvelles tables/repositories.
      - Export `liveRouter` + alias `channelRouter` pour rétrocompatibilité.
    - `app/src/routers/channel.ts`
      - Remplacé par un re-export de `liveRouter as channelRouter` depuis `live.ts`.
    - `app/src/routers/index.ts`
      - Monte `live: liveRouter`. L'alias `channel:` est retiré.

## Manual operations

- Aucune opération manuelle requise.

## Status

completed
