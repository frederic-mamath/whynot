# Ticket 01 — Polices Outfit & Syne auto-hébergées

### Acceptance Criteria

- As a developer, in any component, when I use `font-outfit` or `font-syne` Tailwind classes, I should see the correct fonts render in the browser
- As a developer, when the app is deployed on `https://whynot-app.onrender.com`, I should see the fonts load correctly without any external CDN dependency
- As a developer, when I inspect the network tab, I should see the font files served from the same origin as the app

### Technical Strategy

- Frontend — Configuration
  - **Opération manuelle :** copier les deux fichiers depuis le dossier Outfit/Syne téléchargé :
    - `Outfit-VariableFont_wght.ttf` → `app/client/src/assets/fonts/`
    - `Syne-VariableFont_wght.ttf` → `app/client/src/assets/fonts/`
  - `app/client/src/index.css`
    - `@font-face` Outfit : `src: url("./assets/fonts/Outfit-VariableFont_wght.ttf")`, `font-weight: 100 900`, `font-display: swap`
    - `@font-face` Syne : `src: url("./assets/fonts/Syne-VariableFont_wght.ttf")`, `font-weight: 400 800`, `font-display: swap`
    - Dans `@theme inline { }` : ajouter `--font-outfit: "Outfit", sans-serif` et `--font-syne: "Syne", sans-serif`

### Manual operations to configure services

- Aucun service tiers à configurer
- Vite détecte automatiquement les assets dans `src/assets/` et les hash dans `dist/` lors du build
- Render sert les fichiers statiques via le serveur Express existant (`app.use(express.static(...))`) — aucun changement de configuration nécessaire
