# Ticket 01 — Setup i18next + Landing & Auth pages

## Acceptance Criteria

- As a developer, when I run the app, i18next is initialized with French as default language
- As a user, in the Landing page, I see all text in French ("Shopping en direct", "Enchères en temps réel", etc.)
- As a user, in the Login page, I see all text in French ("Connexion", "Se connecter", "Pas encore de compte ?")
- As a user, in the Register page, I see all text in French ("Créer un compte", "S'inscrire", "Déjà un compte ?")

## Technical Strategy

- Frontend
  - Configuration
    - `app/client/src/lib/i18n.ts` _(new file)_
      - Initialise i18next avec `react-i18next`, langue par défaut `fr`, interpolation escapeValue false
    - `app/client/src/locales/fr.json` _(new file)_
      - Fichier de traduction FR avec les namespaces : `landing`, `login`, `register`, `common`
    - `app/client/src/main.tsx`
      - Import de `./lib/i18n` avant le render pour initialiser i18next
  - Package
    - `package.json`
      - Ajouter `i18next` et `react-i18next` comme dépendances
  - Pages
    - `app/client/src/pages/LandingPage.tsx`
      - Remplacer tous les strings EN par `t('landing.xxx')` via `useTranslation()`
      - ~45 chaînes : hero, features, how it works, CTA, footer
    - `app/client/src/pages/LoginPage.tsx`
      - Remplacer ~10 chaînes : titre, labels, boutons, liens, erreurs
    - `app/client/src/pages/RegisterPage.tsx`
      - Remplacer ~12 chaînes : titre, labels, validation, boutons, liens

## Manual operations to configure services

- Installer les dépendances :
  ```bash
  cd app && npm install i18next react-i18next
  ```
