# Design System Guidelines

## Overview
This project uses **Shadcn UI** as its primary design system to ensure consistency, accessibility, and a modern user interface across all components.

## Philosophy
- **Consistency First**: Use Shadcn components wherever possible
- **Accessibility**: All components are built with accessibility in mind
- **Customizable**: Components can be customized while maintaining design consistency
- **Type-Safe**: Full TypeScript support

---

## Core Technologies

### Shadcn UI
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: Tailwind CSS v4
- **Animations**: tailwindcss-animate
- **Utilities**: class-variance-authority (CVA), clsx, tailwind-merge

### Toast Notifications
- **Library**: Sonner
- **Position**: bottom-right
- **Rich Colors**: Enabled
- **Usage**: `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`

---

## Component Guidelines

### Buttons
**Always use Shadcn Button component** instead of native HTML `<button>` elements.

```tsx
import { Button } from '../../components/ui/button';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

// Example: Channel Controls
<Button
  variant={audioMuted ? "destructive" : "secondary"}
  size="lg"
  onClick={toggleAudio}
>
  {audioMuted ? "🔇" : "🎤"}
</Button>
```

### When to Use Each Variant

| Variant | Use Case | Example |
|---------|----------|---------|
| `default` | Primary actions | Submit, Save, Join Channel |
| `destructive` | Dangerous actions | Delete, Leave, End Channel |
| `outline` | Secondary actions with emphasis | Cancel, Back |
| `secondary` | Tertiary actions | Toggle controls, Settings |
| `ghost` | Minimal actions | Navigation items |
| `link` | Text links that act as buttons | "Learn more" |

---

## Toast Notifications

### Usage Pattern
```tsx
import { toast } from 'sonner';

// Success (green)
toast.success('Successfully joined the channel!');

// Error (red)
toast.error('Failed to join channel: Connection timeout');

// Info (blue)
toast.info('User 123 left the channel');

// Warning (orange)
toast.warning('Network quality is poor');
```

### Best Practices
- ✅ **DO**: Use toasts for user feedback on actions
- ✅ **DO**: Keep messages concise and actionable
- ✅ **DO**: Use appropriate types (success/error/info/warning)
- ❌ **DON'T**: Spam toasts for every minor event
- ❌ **DON'T**: Use toasts for critical errors (use error boundaries instead)

---

## Color Utilities

### Tailwind CSS Classes
Use Tailwind utility classes for consistent spacing, colors, and layouts:

```tsx
// Spacing
className="px-4 py-2 mt-4 mb-8"

// Colors
className="bg-blue-500 text-white hover:bg-blue-600"

// Flexbox
className="flex items-center justify-between gap-4"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

### CSS Modules
For component-specific styles, use CSS Modules with Tailwind:

```scss
// ChannelPage.module.scss
.channelContainer {
  @apply min-h-screen flex flex-col;
}

.channelControls {
  @apply flex gap-4 justify-center items-center;
}
```

---

## Component Structure

### Standard Component Pattern
```
ComponentName/
├── ComponentName.tsx         # Main component logic
├── ComponentName.module.scss # Scoped styles (if needed)
└── index.ts                  # Re-export
```

### Example
```tsx
// Button usage in a component
import { Button } from '../../components/ui/button';
import styles from './MyComponent.module.scss';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      <Button variant="default" size="lg">
        Click Me
      </Button>
    </div>
  );
}
```

---

## Accessibility

All Shadcn components follow accessibility best practices:
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ ARIA attributes

### Examples
```tsx
// Button with accessible title
<Button title="Mute microphone" onClick={toggleAudio}>
  🎤
</Button>

// Icon buttons should always have title/aria-label
<Button size="icon" title="Settings">
  ⚙️
</Button>
```

---

## Adding New Shadcn Components

When adding new Shadcn components:

1. **Install dependencies** (if needed)
```bash
npm install @radix-ui/react-[component-name]
```

2. **Create component file**
```bash
client/src/components/ui/[component-name].tsx
```

3. **Follow Shadcn patterns**
- Use CVA for variants
- Export both component and variants
- Include proper TypeScript types

4. **Document usage** in this file

---

## Theme Configuration

### Tailwind Config
Location: `tailwind.config.js`

```js
export default {
  darkMode: ["class"],
  content: [
    './client/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

### CSS Variables
Location: `client/src/index.css`

```css
@layer base {
  :root {
    --radius: 0.5rem;
  }
}
```

---

## Utilities

### `cn()` Helper
Combines class names intelligently:

```tsx
import { cn } from '../../lib/utils';

// Merge classes with conflict resolution
<Button className={cn("px-4", isActive && "bg-blue-500")} />
```

---

## Migration Checklist

When converting existing components:

- [ ] Replace `<button>` with `<Button>` from shadcn
- [ ] Replace custom toast with Sonner
- [ ] Use Tailwind classes instead of inline styles
- [ ] Add proper accessibility attributes
- [ ] Test keyboard navigation
- [ ] Verify responsive design

---

## Resources

- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [CVA Documentation](https://cva.style/docs)

---

## Future Components to Add

Priority list for Shadcn components to integrate:

1. **Dialog** - For modals and confirmations
2. **Card** - For channel list items
3. **Badge** - For participant count, status indicators
4. **Avatar** - For user profile pictures
5. **Tooltip** - For hover information
6. **Dropdown Menu** - For settings and options
7. **Switch** - For toggle controls
8. **Skeleton** - For loading states
9. **Alert** - For important notifications
10. **Tabs** - For navigation within pages

---

**Last Updated**: 2025-12-21  
**Maintainer**: Development Team
