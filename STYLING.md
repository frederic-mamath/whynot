# Styling Guide

## Design System

**Shadcn UI** + **Tailwind CSS** + **Lucide Icons**

- Always use Shadcn components from `client/src/components/ui/`
- If component doesn't exist, check [Shadcn docs](https://ui.shadcn.com/)
- All styling via Tailwind CSS utilities (no CSS modules)
- Icons from [Lucide React](https://lucide.dev/)

## Thème & Design Tokens (Tailwind v4)

Ce projet utilise l'approche **CSS-first** de Tailwind CSS v4 — pas de `tailwind.config.js`.  
Les couleurs, polices et tokens sont définis directement dans `client/src/index.css`.

> **WelcomePage** (`client/src/pages/WelcomePage/WelcomePage.tsx`) est le **playground du design system**.  
> Teste toute modification de palette ou de typographie ici en premier.

### Ajouter une couleur custom

```css
/* Étape 1 — Définir la valeur brute dans :root */
:root {
  --brand-yellow: rgb(224, 255, 0);
}

/* Étape 2 — Mapper dans @theme inline */
@theme inline {
  --color-brand-yellow: var(--brand-yellow);
}
```

Tailwind génère automatiquement les classes utilitaires :

```tsx
<div className="bg-brand-yellow text-brand-yellow border-brand-yellow" />
```

### Tokens de base disponíbles

Toujours préférer les tokens aux couleurs Tailwind brutes :

```tsx
<div className="bg-background text-foreground" />   // Fond de page & texte principal
<div className="bg-card text-card-foreground" />     // Surfaces card
<div className="text-primary" />                     // Couleur d'accent de marque
<div className="text-muted-foreground" />            // Texte secondaire
<div className="border-border" />                    // Bordures par défaut
```

### Utiliser les polices

Les polices sont déclarées via `@font-face` dans `index.css` puis mappées dans `@theme inline` :

```css
@theme inline {
  --font-outfit: "Outfit", sans-serif;
  --font-syne: "Syne", sans-serif;
}
```

Usage dans les composants :

```tsx
<h1 className="font-outfit font-black">popup</h1>
<h2 className="font-syne font-extrabold">Achète et vends en live.</h2>
```

### Ajouter une nouvelle police

1. Copier le fichier `.ttf` dans `client/src/assets/fonts/`
2. Ajouter un bloc `@font-face` dans `index.css` (voir les déclarations Outfit/Syne existantes)
3. Mapper dans `@theme inline` : `--font-ma-police: "Ma Police", sans-serif;`
4. Utiliser la classe `font-ma-police` dans les composants

## Approach

### Mobile-First Responsive Design

Always start with mobile styles, then add responsive breakpoints:

```tsx
// Mobile first (default = mobile)
<div className="flex-col gap-2 text-sm">
  {/* Tablet and up */}
  <div className="md:flex-row md:gap-4 md:text-base">
    {/* Desktop and up */}
    <div className="lg:gap-6 lg:text-lg" />
  </div>
</div>
```

**Breakpoints:**

- `sm:` - 640px and up (small tablets)
- `md:` - 768px and up (tablets)
- `lg:` - 1024px and up (desktops)
- `xl:` - 1280px and up (large desktops)

### Tailwind Utilities

Apply classes directly in JSX:

```tsx
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  <h3 className="text-xl font-semibold">Title</h3>
</div>
```

### Conditional Styling

Use `cn()` helper:

```tsx
import { cn } from "../lib/utils";

<Button
  className={cn(
    "px-4 py-2",
    isActive && "bg-indigo-500",
    isDisabled && "opacity-50",
  )}
/>;
```

## Components

### Shadcn Components

Check `client/src/components/ui/` first. If not found, check [Shadcn docs](https://ui.shadcn.com/).

### Button Variants

```tsx
import { Button } from '../components/ui/button';

<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Minimal</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Icons

```tsx
import { User, Settings, LogOut } from 'lucide-react';

<User className="w-4 h-4" />
<Settings className="w-6 h-6 text-gray-500" />
```

## Notifications

Use Sonner for toast notifications:

```tsx
import { toast } from "sonner";

toast.success("Success message");
toast.error("Error message");
toast.info("Info message");
toast.warning("Warning message");
```

## Common Patterns

### Layout

```tsx
// Flexbox
className = "flex items-center justify-between gap-4";
className = "flex flex-col md:flex-row"; // Mobile: column, Desktop: row

// Grid
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

// Container
className = "max-w-7xl mx-auto px-4 md:px-6 lg:px-8";
```

### Spacing

```tsx
className = "p-4"; // padding all sides
className = "px-4 py-2"; // horizontal and vertical padding
className = "gap-4"; // gap between flex/grid items
```

### Typography

```tsx
className = "text-sm md:text-base"; // Responsive text
className = "font-medium"; // Weight
className = "text-gray-900"; // Color
```

### Responsive Utilities

```tsx
className = "hidden md:block"; // Hide on mobile
className = "block md:hidden"; // Show only on mobile
className = "w-full md:w-1/2 lg:w-1/3"; // Responsive widths
```

## Accessibility

- Always add `title` or `aria-label` to icon-only buttons
- Use semantic HTML with Shadcn components
- Test keyboard navigation
- Ensure proper focus states

## Resources

- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [CVA](https://cva.style/docs)
