# Ticket 04 — Conversion WelcomePage vers TailwindCSS

_Dépend de Ticket 01 (tokens polices disponibles) et Ticket 03 (tokens couleurs documentés)_

### Acceptance Criteria

- As a developer, in `WelcomePage.tsx`, when I inspect the JSX, I should see zero `style={{ }}` props
- As a developer, when I view the WelcomePage, I should see it render identically to before the migration
- As a developer, in `ButtonV2.tsx`, when I pass a `className` prop, I should see it applied correctly (prop `style` remplacée par `className`)
- As a user, on the WelcomePage, I should see the "popup" title in Outfit Black, the subtitle in Syne ExtraBold, and the body text in Outfit Regular

### Technical Strategy

- Frontend — Composant
  - `app/client/src/components/ui/ButtonV2/ButtonV2.tsx`
    - Remplacer la prop `style?: React.CSSProperties` par `className?: string`
    - Migrer les styles inline de la `<button>` vers des classes Tailwind (flex, rounded, gap)
    - Migrer les styles inline du `<a>` vers des classes Tailwind (py-[14px], w-full, text-center)
    - Fusionner avec `cn()` pour permettre l'override via `className`
  - `app/client/src/pages/WelcomePage/WelcomePage.tsx`
    - Supprimer tous les props `style={{ ... }}`
    - Mapping des valeurs inline vers les tokens du thème :

| Valeur inline                      | Token thème               | Classe Tailwind                   |
| :--------------------------------- | :------------------------ | :-------------------------------- |
| `fontFamily: "Outfit, sans-serif"` | `--font-outfit`           | `font-outfit`                     |
| `fontFamily: "Syne, sans-serif"`   | `--font-syne`             | `font-syne`                       |
| `rgb(224, 255, 0)`                 | `--primary`               | `text-primary` / `border-primary` |
| `rgb(240, 240, 232)`               | `--foreground`            | `text-foreground`                 |
| `rgb(119, 119, 119)`               | `--muted-foreground`      | `text-muted-foreground`           |
| `rgb(26, 26, 26)`                  | `--background` / `--card` | `bg-card`                         |
| `rgb(0, 0, 0)`                     | —                         | `text-black`                      |
| `rgb(255, 255, 255)`               | —                         | `bg-white`                        |
| `rgb(68, 68, 68)`                  | `--border`                | `bg-border` / `text-border`       |

### Manual operations to configure services

- Aucun
