# Feature 023 — Onboarding OAuth : Pseudo + Avatar

## Objectif

Après une connexion OAuth (Apple ou Google), tout nouvel utilisateur est redirigé vers une page d'onboarding `/onboarding` où il choisit un pseudo unique (obligatoire) et peut ajouter une photo de profil (optionnel). L'accès aux pages protégées est bloqué tant que l'onboarding n'est pas complété.

## Prompt initial

Follow instructions in plan.prompt.md.
As a user, when i sign in successfully with Apple or Google, I want to see a page to set my mandatory nickname and add an optional avatar.

Do you have any questions ?

## Statut des tickets

| User Story                                                                                                                               | Ticket    | Status    |
| :--------------------------------------------------------------------------------------------------------------------------------------- | :-------- | :-------- |
| En tant que développeur, la table `users` dispose des colonnes `avatar_url` et `has_completed_onboarding`.                               | ticket-01 | completed |
| En tant que développeur, les nouveaux utilisateurs OAuth ont `has_completed_onboarding = false` à la création.                           | ticket-01 | completed |
| En tant que développeur, les utilisateurs existants ont `has_completed_onboarding = true` (pas de régression).                           | ticket-01 | completed |
| En tant que développeur, `profile.me` expose `nickname`, `avatarUrl`, `hasCompletedOnboarding`.                                          | ticket-02 | completed |
| En tant que développeur, la mutation `profile.completeOnboarding` valide l'unicité du pseudo et met à jour le profil.                    | ticket-02 | completed |
| En tant qu'utilisateur connecté via OAuth, après ma première connexion, je suis redirigé vers `/onboarding`.                             | ticket-03 | completed |
| En tant qu'utilisateur, sur la page `/onboarding`, je peux choisir un pseudo unique (obligatoire).                                       | ticket-03 | completed |
| En tant qu'utilisateur, sur la page `/onboarding`, je peux ajouter une photo de profil (optionnel).                                      | ticket-03 | completed |
| En tant qu'utilisateur, si je tente d'accéder à une page protégée sans avoir complété l'onboarding, je suis redirigé vers `/onboarding`. | ticket-03 | completed |
