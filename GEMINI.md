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

## Styling Approach

### Tailwind CSS Utility-First
This project uses **Tailwind CSS** for all styling with a utility-first approach. CSS Modules have been completely removed in favor of Tailwind utilities.

#### Benefits
- **Consistency**: Design tokens ensure visual consistency
- **Performance**: Automatic purging removes unused CSS
- **Developer Experience**: IntelliSense support, no context switching
- **Maintainability**: Styles co-located with components
- **Responsive**: Built-in responsive utilities

### Styling Guidelines

#### 1. Use Tailwind Utilities Directly
**Always apply Tailwind classes directly in JSX/TSX**:

```tsx
// ✅ DO: Use Tailwind utilities directly
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h3 className="text-xl font-semibold text-gray-900">Channel Name</h3>
  <Button>Join</Button>
</div>

// ❌ DON'T: Create CSS modules
import styles from './Component.module.scss'; // Deprecated
```

#### 2. Conditional Styling with `cn()`
Use the `cn()` utility for conditional classes:

```tsx
import { cn } from '../../lib/utils';

<Button
  className={cn(
    "px-4 py-2",
    isActive && "bg-indigo-500 text-white",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
/>
```

#### 3. Responsive Design
Leverage Tailwind's responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid: 1 column mobile, 2 tablet, 3 desktop */}
</div>

<nav className="flex-col md:flex-row">
  {/* Stack vertically on mobile, horizontally on desktop */}
</nav>
```

#### 4. Complex Layouts
For complex layouts, extract to components instead of using `@apply`:

```tsx
// ✅ DO: Create reusable components
function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
      <h3 className="text-xl font-semibold">{channel.name}</h3>
      <Button>Join</Button>
    </div>
  );
}

// ❌ DON'T: Use @apply in CSS modules
// .channelCard { @apply bg-white rounded-xl p-6 ... }
```

### Common Patterns

#### Spacing
```tsx
// Padding & Margin
className="p-4"       // padding: 1rem all sides
className="px-6 py-4" // padding-x: 1.5rem, padding-y: 1rem
className="mt-8 mb-4" // margin-top: 2rem, margin-bottom: 1rem

// Gap (for flex/grid)
className="flex gap-4"        // gap: 1rem
className="grid gap-x-6 gap-y-4" // gap-x: 1.5rem, gap-y: 1rem
```

#### Colors
```tsx
// Background
className="bg-white"
className="bg-gray-900"
className="bg-indigo-500"

// Text
className="text-gray-900"
className="text-white"
className="text-red-700"

// Borders
className="border border-gray-300"
className="border-2 border-indigo-500"
```

#### Layout
```tsx
// Flexbox
className="flex items-center justify-between gap-4"
className="flex flex-col md:flex-row"

// Grid
className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Positioning
className="fixed bottom-20 right-5 z-100"
className="absolute top-3 left-3"
className="relative"
```

#### Typography
```tsx
className="text-base font-normal"    // 16px, 400
className="text-lg font-medium"      // 18px, 500
className="text-xl font-semibold"    // 20px, 600
className="text-2xl font-bold"       // 24px, 700
```

#### Shadows & Borders
```tsx
className="shadow-sm"      // subtle shadow
className="shadow-md"      // medium shadow
className="shadow-lg"      // large shadow
className="rounded-lg"     // border-radius: 0.5rem
className="rounded-xl"     // border-radius: 0.75rem
```

### Component-Specific Styling

#### Video Grid Layout
```tsx
<div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 p-4">
  {/* Auto-fitting grid for video streams */}
</div>
```

#### Fixed Overlays
```tsx
<div className="fixed bottom-[100px] right-5 w-[280px] border-3 border-indigo-500 z-[100]">
  {/* Local video feed in corner */}
</div>
```

#### Cards
```tsx
<div className="bg-white rounded-xl p-6 flex flex-col gap-4 shadow-md">
  {/* Channel card */}
</div>
```

---

## Component Structure

### Standard Component Pattern
For reusable components (not pages):
```
ComponentName/
├── ComponentName.tsx    # Main component logic and Tailwind styles
└── index.ts            # Re-export
```

For page components:
```
pages/
├── PageName/
│   ├── PageName.tsx    # Page component with Tailwind styles
│   └── index.ts        # Re-export
```

### Example
```tsx
// Modern component with Tailwind
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

export default function ChannelCard({ channel, isActive }: Props) {
  return (
    <div className={cn(
      "bg-white rounded-xl p-6 flex flex-col gap-4 shadow-md transition-all",
      isActive && "ring-2 ring-indigo-500"
    )}>
      <h3 className="text-xl font-semibold text-gray-900">{channel.name}</h3>
      <Button variant="default">Join Channel</Button>
    </div>
  );
}
```

**Note**: CSS Modules (`.module.scss` files) are deprecated and should not be used.

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

When creating new components or updating existing ones:

- [x] Replace `<button>` with `<Button>` from shadcn
- [x] Replace custom toast with Sonner
- [x] Use Tailwind classes instead of CSS modules
- [x] Use Tailwind classes instead of inline styles
- [x] Add proper accessibility attributes
- [ ] Test keyboard navigation
- [ ] Verify responsive design
- [x] Remove all `.module.scss` files (completed)

### Completed Migrations
- ✅ NavBar component
- ✅ NetworkQuality component
- ✅ ParticipantList component
- ✅ ChannelPage
- ✅ CreateChannelPage
- ✅ ChannelsPage
- ✅ All CSS modules removed from codebase

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
