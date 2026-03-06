# Ticket 02 — Suppression du système de thème clair/sombre

### Acceptance Criteria

- As a developer, when I build the app, I should see no references to `ThemeProvider`, `useTheme`, or `ThemeToggle` remaining in the codebase
- As a developer, when I view the CSS, I should see no `.dark { }` override block in `index.css`
- As a developer, when I run `npx tsc --noEmit`, the app should compile without errors

### Technical Strategy

- Frontend — Composants
  - `app/client/src/App.tsx`
    - Supprimer l'import `ThemeProvider`
    - Retirer le wrapper `<ThemeProvider>` autour de `<AppContent />`
  - `app/client/src/components/NavBar/NavBar.tsx`
    - Supprimer l'import `ThemeToggle`
    - Retirer les 3 occurrences JSX de `<ThemeToggle />` (desktop authenticated, desktop unauthenticated, mobile sheet header)
- Frontend — Suppression de fichiers
  - `app/client/src/components/ThemeProvider/ThemeProvider.tsx` — à supprimer
  - `app/client/src/components/ThemeProvider/index.ts` — à supprimer
  - `app/client/src/components/ui/theme-toggle.tsx` — à supprimer
- Frontend — CSS
  - `app/client/src/index.css`
    - Supprimer la ligne `@custom-variant dark (&:is(.dark *));`
    - Supprimer l'intégralité du bloc `.dark { ... }`

### Manual operations to configure services

- Aucun
