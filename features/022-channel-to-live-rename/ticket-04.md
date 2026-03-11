# Ticket 04 — Renommage complet côté frontend

## Acceptance Criteria

- En tant que développeur, tous les appels `trpc.channel.*` dans le frontend sont remplacés par `trpc.live.*`.
- En tant qu'utilisateur, la route `/live/:channelId` affiche la page de détail d'un live (anciennement `/channel/:channelId`).
- En tant qu'utilisateur, la route `/lives` affiche la liste des lives actifs (anciennement `/channels`).
- En tant que développeur, `ChannelCreatePage` est retirée des routes (la création immédiate passe désormais par `SellerGoPage`).
- En tant que développeur, les nouvelles pages `LiveDetailsPage` et `LiveListPage` sont les composants par défaut servis, en reprenant le code de `ChannelDetailsPage` et `ChannelListPage`.
- En tant que développeur, TypeScript compile sans erreur sur l'ensemble du projet.

## Technical Strategy

- Frontend
  - Pages _(créées par copie + renommage)_
    - `app/client/src/pages/LiveDetailsPage.tsx` : copie de `ChannelDetailsPage.tsx` avec `export default function LiveDetailsPage`.
    - `app/client/src/pages/LiveListPage.tsx` : copie de `ChannelListPage.tsx` avec `export default function LiveListPage`.
  - Composants _(sed global)_
    - `app/client/src/components/ParticipantList/ParticipantList.tsx` : `trpc.live.participants`.
    - `app/client/src/components/PromotedProducts/PromotedProducts.tsx` : `trpc.live.highlightProduct`, `trpc.live.unhighlightProduct`.
    - `app/client/src/components/AssociateProductModal/AssociateProductModal.tsx` : `trpc.live.list`.
    - `app/client/src/components/ChatPanel/ChatPanel.tsx` : `trpc.live.subscribeToEvents`.
    - `app/client/src/components/ErrorBoundary/ErrorBoundary.tsx` : `window.location.href = '/lives'`.
  - Pages _(sed global)_
    - `app/client/src/pages/ChannelDetailsPage.tsx` : `trpc.live.*`, `navigate("/lives")`, `to="/lives"`.
    - `app/client/src/pages/ChannelListPage.tsx` : `trpc.live.list`.
    - `app/client/src/pages/MyOrdersPage.tsx` : `to="/lives"`.
    - `app/client/src/pages/SellerLivesPage.tsx` : `navigate(\`/channel/${id}\`)`.
  - Router
    - `app/client/src/App.tsx`
      - Import `LiveListPage` et `LiveDetailsPage`.
      - Suppression import `ChannelCreatePage`.
      - Route `/lives` → `<LiveListPage />`.
      - Route `/live/:channelId` → `<LiveDetailsPage />`.
      - Route `/channel/:channelId` conservée (backward compat) → `<LiveDetailsPage />`.
      - Suppression de la route `/create-channel`.

## Manual operations

- Aucune opération manuelle requise.
- Note backward compat : la route `/channel/:channelId` est conservée temporairement pour éviter de casser les liens partagés existants. Elle peut être retirée lors d'une prochaine itération.

## Status

completed
