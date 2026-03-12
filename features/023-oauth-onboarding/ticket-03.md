# Ticket 03 — Frontend : OnboardingPage + OnboardingGuard

## Acceptance Criteria

- En tant qu'utilisateur connecté via OAuth avec `hasCompletedOnboarding = false`, quand je navigue vers n'importe quelle route protégée, je suis redirigé vers `/onboarding`.
- En tant qu'utilisateur, sur `/onboarding`, je vois un champ "Pseudo" (obligatoire) et un composant d'upload de photo (optionnel).
- En tant qu'utilisateur, si je saisis un pseudo déjà pris, je vois un message d'erreur inline sous le champ.
- En tant qu'utilisateur, si je valide avec un pseudo valide, mon profil est mis à jour et je suis redirigé vers `/dashboard`.
- En tant qu'utilisateur, je ne peux pas ignorer ou fermer la page sans compléter l'onboarding (pas de bouton "passer").

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/OnboardingPage.tsx` _(nouveau)_
      - Formulaire avec `useState` pour `nickname` et `avatarImages: ProductImageItem[]`.
      - Validation locale : champ vide bloqué, message d'erreur inline.
      - `trpc.profile.completeOnboarding.useMutation()` : on success → `navigate("/dashboard")`. On error `CONFLICT` → affichage du message sous le champ pseudo.
      - `ImageUploader` avec `maxImages={1}` pour la photo de profil.
  - Routing / Guard
    - `app/client/src/App.tsx`
      - Import `OnboardingPage`.
      - `OnboardingGuard` _(composant inline)_ : query `trpc.profile.me`. Si authentifié ET `!hasCompletedOnboarding` → `<Navigate to="/onboarding" replace />`. Sinon render `children`.
      - Route `/onboarding` → `<OnboardingPage />` (non protégée par `ProtectedRoute` pour éviter un double redirect).
      - Toutes les routes `<ProtectedRoute>` existantes wrappées dans `<OnboardingGuard>`.

## Manual operations

Aucune.

## Status

completed
