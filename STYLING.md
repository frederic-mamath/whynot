# Styling Guide

## Design System

**Shadcn UI** + **Tailwind CSS** + **Lucide Icons** + **Dark Mode**

- Always use Shadcn components from `client/src/components/ui/`
- If component doesn't exist, check [Shadcn docs](https://ui.shadcn.com/)
- All styling via Tailwind CSS utilities (no CSS modules)
- Icons from [Lucide React](https://lucide.dev/)
- Dark mode powered by `next-themes`

## Dark Mode

### Theme Provider
The app uses `ThemeProvider` from `client/src/components/ThemeProvider` to manage theme state.

```tsx
import { ThemeProvider } from "./components/ThemeProvider";

<ThemeProvider defaultTheme="system" storageKey="whynot-ui-theme">
  {/* Your app */}
</ThemeProvider>
```

### Using Theme in Components
```tsx
import { useTheme } from "../components/ThemeProvider";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle theme
    </button>
  );
}
```

### Theme Toggle Component
Use the `ThemeToggle` component for a pre-built theme switcher:
```tsx
import ThemeToggle from "../components/ui/ThemeToggle";

<ThemeToggle />
```

Cycles through: Light → Dark → System → Light

### Dark Mode Classes
Tailwind automatically applies dark mode classes when `.dark` is on the root element:
```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Automatically adapts to theme
</div>
```

However, prefer using **design tokens** (e.g., `bg-background`, `text-foreground`) which automatically adapt to the current theme.

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
import { cn } from '../lib/utils';

<Button className={cn(
  "px-4 py-2",
  isActive && "bg-indigo-500",
  isDisabled && "opacity-50"
)} />
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
import { toast } from 'sonner';

toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
toast.warning('Warning message');
```

## Common Patterns

### Layout
```tsx
// Flexbox
className="flex items-center justify-between gap-4"
className="flex flex-col md:flex-row" // Mobile: column, Desktop: row

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Container
className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
```

### Spacing
```tsx
className="p-4"       // padding all sides
className="px-4 py-2" // horizontal and vertical padding
className="gap-4"     // gap between flex/grid items
```

### Typography
```tsx
className="text-sm md:text-base"      // Responsive text
className="font-medium"                // Weight
className="text-gray-900"              // Color
```

### Responsive Utilities
```tsx
className="hidden md:block"            // Hide on mobile
className="block md:hidden"            // Show only on mobile
className="w-full md:w-1/2 lg:w-1/3"  // Responsive widths
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
