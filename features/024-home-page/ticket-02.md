# Ticket 02 — Frontend : HomePage + Route + Redirects

## Acceptance Criteria

- En tant qu'utilisateur authentifié post-onboarding, quand je me connecte via Google ou Apple, j'arrive sur `/home`.
- En tant qu'utilisateur, après avoir validé l'onboarding, je suis redirigé vers `/home`.
- En tant qu'utilisateur sur `/home`, je vois la section "Premiers vendeurs" avec la liste des vendeurs ayant une boutique.
- Chaque carte vendeur affiche : avatar circulaire (image si disponible, sinon première lettre du pseudo sur fond coloré déterministe), pseudo en gras, top 3 catégories séparées par `·`.
- Un bouton "Suivre" est visible sur chaque carte (placeholder, non fonctionnel).
- Le bouton "Home" de la BottomNav pointe vers `/home`.
- `/home` est protégé (`ProtectedRoute` + `OnboardingGuard`).

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/HomePage.tsx` _(nouveau)_
      - `trpc.shop.listSellers.useQuery()`.
      - Skeleton pendant le chargement (4 cartes).
      - Fonction `avatarColor(nickname)` : hash déterministe → classe Tailwind `bg-*-500`.
      - Carte : avatar (img ou div colorée) + nickname + topCategories jointes par `·` + bouton "Suivre" (outline, rounded-full).
  - Routing
    - `app/client/src/App.tsx`
      - Import `HomePage`.
      - Route `/home` → `<ProtectedRoute><OnboardingGuard><HomePage /></OnboardingGuard></ProtectedRoute>`.
  - Redirects
    - `app/client/src/pages/OnboardingPage.tsx` : `navigate("/home")` au lieu de `/dashboard`.
    - `app/src/routes/oauth.ts` : les deux callbacks (Google + Apple) redirigent vers `${FRONTEND_URL}/home`.
  - BottomNav
    - `app/client/src/components/BottomNav/BottomNav.tsx` : Home path `/seller` → `/home`.

## Manual operations

Aucune.

## Status

completed
