# Ticket 03 — Guide de thème TailwindCSS + palette de couleurs

### Acceptance Criteria

- As a developer, in `index.css`, when I want to add a custom brand color, I should see a comment guide explaining exactly where and how to define it
- As a developer, in `STYLING.md`, when I search for how to add a font or color, I should find a clear step-by-step guide using the Tailwind v4 CSS-first approach (no `tailwind.config.js`)
- As a developer, when I read `STYLING.md`, I should understand the full flow: CSS variable → `@theme inline` mapping → auto-generated Tailwind utility class

### Technical Strategy

- Frontend — CSS
  - `app/client/src/index.css`
    - Réorganiser le bloc `:root` avec un commentaire guide au sommet expliquant le pattern en 3 étapes :
      1. Définir la valeur brute dans `:root` (`--brand-yellow: rgb(224, 255, 0)`)
      2. Mapper dans `@theme inline` (`--color-brand-yellow: var(--brand-yellow)`)
      3. Utiliser la classe Tailwind auto-générée (`bg-brand-yellow`, `text-brand-yellow`)
    - Annoter les sections de la palette avec des commentaires guides pour indiquer où placer les couleurs de marque
- Documentation
  - `STYLING.md`
    - Remplacer la section "Dark Mode" par une section "Thème & Design Tokens (Tailwind v4)"
    - Documenter : ajout de couleur, tokens sémantiques disponibles, ajout de police
    - Mentionner la WelcomePage comme playground de référence

### Manual operations to configure services

- Aucun — le développeur remplit la palette manuellement dans `index.css` après ce ticket
