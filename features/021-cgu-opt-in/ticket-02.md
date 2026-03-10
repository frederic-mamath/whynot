# Ticket 02 — Shadcn Checkbox + pages légales + routes publiques

## Acceptance Criteria

- En tant qu'utilisateur non connecté, quand j'accède à `/cgu`, je vois la page des Conditions Générales d'Utilisation complète en français.
- En tant qu'utilisateur non connecté, quand j'accède à `/politique-de-confidentialite`, je vois la Politique de Confidentialité conforme RGPD en français.
- En tant que développeur, le composant Shadcn `Checkbox` est disponible dans le projet et importable depuis `@/components/ui/checkbox`.
- En tant qu'utilisateur, les deux pages sont accessibles sans connexion (aucun `ProtectedRoute`).

## Technical Strategy

- Frontend
  - Composant UI
    - `app/client/src/components/ui/checkbox.tsx`
      - Installation via `npx --yes shadcn@latest add checkbox` dans le dossier `app/`. Génère le composant Radix UI stylistiquement intégré au design system Tailwind.
  - Page CGU
    - `app/client/src/pages/CguPage/CguPage.tsx`
      - Créer la page avec 9 sections : Objet du service, Inscription & compte, Conditions Vendeurs, Conditions Acheteurs, Enchères & paiements (Stripe), Propriété intellectuelle, Responsabilité, Résiliation, Droit applicable (France).
      - Utilise `font-syne` pour les titres, `font-outfit` pour le corps.
      - Lien "Retour" vers `/register`.
    - `app/client/src/pages/CguPage/index.ts`
      - Barrel export : `export { default } from "./CguPage"`.
  - Page Politique de Confidentialité
    - `app/client/src/pages/PolitiqueConfidentialitePage/PolitiqueConfidentialitePage.tsx`
      - Créer la page avec 8 sections : Introduction, Données collectées (email, Stripe, Agora, OAuth), Finalités, Partage tiers (Stripe / Agora / Google / Apple avec liens), Durée de conservation, Droits RGPD (accès, rectification, effacement, portabilité, opposition), Sécurité, Contact.
      - Liens vers politiques de confidentialité Stripe, Agora, Google, Apple (`target="_blank" rel="noopener noreferrer"`).
      - Lien vers CNIL.
    - `app/client/src/pages/PolitiqueConfidentialitePage/index.ts`
      - Barrel export : `export { default } from "./PolitiqueConfidentialitePage"`.
  - Router
    - `app/client/src/App.tsx`
      - Importe `CguPage` et `PolitiqueConfidentialitePage`.
      - Ajoute `<Route path="/cgu" element={<CguPage />} />` (public, sans `ProtectedRoute`).
      - Ajoute `<Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialitePage />} />` (public).

## Manual operations

Aucune.

## Status

completed
