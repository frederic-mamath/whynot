# Ticket 02 — Dashboard, Profile & NavBar

## Acceptance Criteria

- As a user, in the Dashboard page, I see all text in French ("Tableau de bord", "Mes chaînes", "Ma boutique", etc.)
- As a user, in the Profile page, I see all text in French ("Mon profil", "Informations personnelles", "Moyen de paiement", etc.)
- As a user, the NavBar displays all labels and menus in French ("Accueil", "Chaînes", "Profil", "Se déconnecter")

## Technical Strategy

- Frontend
  - Locales
    - `app/client/src/locales/fr.json`
      - Ajouter les namespaces : `dashboard`, `profile`, `navbar`
  - Pages
    - `app/client/src/pages/DashboardPage.tsx`
      - Remplacer ~12 chaînes : titre, sections, badges, boutons, états vides
    - `app/client/src/pages/ProfilePage.tsx`
      - Remplacer ~40 chaînes : titre, labels des champs, boutons, section paiement, messages d'erreur/succès
  - Components
    - `app/client/src/components/NavBar/NavBar.tsx`
      - Remplacer ~20 chaînes : liens de navigation, labels de menu, bouton déconnexion, texte de bienvenue, liens mobile
