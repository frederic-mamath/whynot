# Ticket 03 — Page `SellerLivePage` (Programme + +Live)

## Acceptance Criteria

- En tant que vendeur, dans la BottomNav, quand je clique sur "Lives", j'arrive sur `SellerLivesPage` avec deux onglets : **Programme** et **+Live**.
- En tant que vendeur, dans l'onglet **Programme**, je vois la section "À venir" listant mes prochains lives planifiés (nom, date/heure, bouton "Démarrer").
- En tant que vendeur, dans l'onglet **Programme**, je vois la section "Passés" listant mes lives terminés (nom, date, statut).
- En tant que vendeur, dans l'onglet **Programme**, quand je clique sur "Démarrer" d'un live planifié, j'appelle `trpc.live.start` et suis redirigé vers `/channel/:id`.
- En tant que vendeur, dans l'onglet **+Live**, je peux saisir un nom (obligatoire ≥ 3 caractères), une description optionnelle, une date et une heure (défaut : aujourd'hui à 20h00).
- En tant que vendeur, dans l'onglet **+Live**, quand je valide, `trpc.live.schedule` est appelé et je suis redirigé automatiquement vers l'onglet **Programme**.

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/SellerLivesPage.tsx` _(remplacé)_
      - State local `activeTab` : `"programme"` | `"new"`.
      - Query `trpc.live.listByHost.useQuery()` : alimente les deux sections.
      - Mutation `trpc.live.schedule.useMutation()` : soumission du formulaire.
      - Mutation `trpc.live.start.useMutation()` : bouton "Démarrer" sur un live planifié.
      - Composant `Tabs` (custom) pour la navigation entre onglets.
      - Composants Shadcn : `Card`, `CardContent`, `Input`, `Label`, `Textarea`.
      - Composant `ButtonV2` pour les actions.
      - Icônes Lucide : `Radio`, `Calendar`, `Clock`, `Play`, `ChevronRight`.
      - Helper `formatDateTime()` : formatage date/heure en français.
      - Helper `todayDate()` : retourne la date du jour en `YYYY-MM-DD`.

## Manual operations

- Aucune opération manuelle requise.

## Status

completed
