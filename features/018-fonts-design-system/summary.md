# 018 — Polices, Suppression du Thème & Design System

Intégrer les polices Outfit et Syne en auto-hébergement (variable fonts), supprimer le système de thème clair/sombre devenu inutile, documenter l'approche de thème Tailwind v4 CSS-first, et convertir la WelcomePage de styles inline vers des classes Tailwind. La WelcomePage devient le playground de référence du design system.

## Key Decisions

- **Variable fonts uniquement** — `Outfit-VariableFont_wght.ttf` + `Syne-VariableFont_wght.ttf` (1 fichier par famille, couvre toutes les graisses)
- **Auto-hébergé** dans `client/src/assets/fonts/` — pipeline Vite, identique local + Render, pas de dépendance réseau externe
- **Suppression totale du ThemeProvider** — pas de désactivation partielle
- **Approche CSS-first Tailwind v4** — pas de `tailwind.config.js`, tout dans `index.css` via `@theme inline`
- **WelcomePage = playground** — référence visuelle du design system, 0 style inline

| User Story                                                                                                                               | Status    |
| :--------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| As a developer, when I use `font-outfit` or `font-syne` Tailwind classes, the correct fonts load identically in local dev and on staging | completed |
| As a developer, the app no longer uses ThemeProvider, ThemeToggle or dark mode CSS variables                                             | completed |
| As a developer, STYLING.md contains a clear guide on how to define colors and fonts using the Tailwind v4 CSS-first approach             | completed |
| As a developer, index.css has commented sections explaining how to build a custom palette                                                | completed |
| As a user, WelcomePage renders with zero inline styles — all styling uses Tailwind classes and theme tokens                              | completed |
