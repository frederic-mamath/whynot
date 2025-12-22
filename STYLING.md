# Styling Guide - NotWhat

**Last Updated**: December 22, 2024

## Overview

This project uses **Shadcn UI** as its primary design system built on top of **Tailwind CSS v4** to ensure consistency, accessibility, and a modern user interface.

## Core Philosophy

1. **Shadcn First** - Always prefer Shadcn components over custom implementations
2. **Tailwind for Utilities** - Use Tailwind classes for spacing, layout, and custom styling
3. **Design Consistency** - Follow the design tokens and color system
4. **Type Safety** - Full TypeScript support for all components
5. **Accessibility** - WCAG compliant components by default

---

## Technology Stack

### UI Framework
- **Shadcn UI** - Component library ([shadcn/ui](https://ui.shadcn.com/))
- **Tailwind CSS v4** - Utility-first CSS framework
- **React 19** - UI rendering

### Styling Dependencies
```json
{
  "tailwindcss": "^4.0.0",
  "@tailwindcss/postcss": "^4.0.0",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.4.0",
  "@radix-ui/react-slot": "^1.2.4",
  "lucide-react": "^0.562.0"
}
```

### Icon Library
- **Lucide React** - Modern icon library ([lucide.dev](https://lucide.dev/))
  - 1000+ beautiful, consistent icons
  - Perfect integration with Shadcn components
  - Tree-shakeable (import only what you need)
  - TypeScript support

---

## Architecture

### Server & Client Setup
- **Server**: Express on port 3000 (`npm run dev`)
- **Client**: Vite dev server on port 5173 (`npm run dev:client`)
- **Proxy**: Vite proxies `/trpc` requests to server

### File Structure
```
client/src/
├── components/
│   └── ui/
│       └── Button/           # Shadcn components
│           └── Button.tsx
├── lib/
│   └── utils.ts             # cn() utility
├── index.css                # Tailwind imports & design tokens
└── main.tsx
```

---

## Design Tokens

### Color System (HSL)
Defined in `client/src/index.css`:

```css
@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 222.2 47.4% 11.2%;
  --color-primary-foreground: 210 40% 98%;
  --color-secondary: 210 40% 96.1%;
  --color-secondary-foreground: 222.2 47.4% 11.2%;
  --color-destructive: 0 84.2% 60.2%;
  --color-destructive-foreground: 210 40% 98%;
  --color-accent: 210 40% 96.1%;
  --color-accent-foreground: 222.2 47.4% 11.2%;
  --color-border: 214.3 31.8% 91.4%;
  --color-input: 214.3 31.8% 91.4%;
  --color-ring: 222.2 84% 4.9%;
  
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}
```

### Accessing Colors in Tailwind
```tsx
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-secondary text-secondary-foreground">Secondary</div>
<div className="bg-destructive text-destructive-foreground">Danger</div>
<div className="border border-border">With Border</div>
```

---

## Component Guidelines

### 1. Icons with Lucide React

**Library**: [lucide.dev](https://lucide.dev/)

#### Import
```tsx
import { Search, User, Settings, Home, Plus } from 'lucide-react';
```

#### Basic Usage
```tsx
// Standalone icon
<Search className="size-5 text-muted-foreground" />

// With custom size
<User className="size-6 text-primary" />

// In button
<Button variant="ghost" size="icon">
  <Settings className="size-4" />
</Button>

// With text
<Button>
  <Plus className="size-4" />
  Create Channel
</Button>
```

#### Icon Sizes
| Class | Size | Use Case |
|-------|------|----------|
| `size-3` | 12px | Very small, badges |
| `size-4` | 16px | Buttons, inline text |
| `size-5` | 20px | Standalone icons |
| `size-6` | 24px | Headers, emphasis |
| `size-8` | 32px | Large UI elements |

#### Common Icons
```tsx
// Navigation
import { Home, Video, Users, Settings } from 'lucide-react';

// Actions
import { Plus, Edit, Trash2, Send, Save, Search } from 'lucide-react';

// Media controls
import { Mic, MicOff, Video, VideoOff, Share2, PhoneOff } from 'lucide-react';

// UI
import { Menu, X, ChevronDown, MoreVertical, Bell } from 'lucide-react';

// Status
import { Check, AlertCircle, Info, XCircle, Loader2 } from 'lucide-react';
```

#### Best Practices
- ✅ Use `size-4` for icons inside buttons
- ✅ Use semantic colors: `text-primary`, `text-destructive`, `text-muted-foreground`
- ✅ Add `title` or `aria-label` for accessibility
- ✅ Use conditional rendering for toggle states (Mic/MicOff)
- ❌ Don't use hardcoded sizes like `w-4 h-4` (use `size-4`)

### 2. Input Component

**Location**: `client/src/components/ui/Input/Input.tsx`

#### Import
```tsx
import Input from '@/components/ui/Input';
```

#### Basic Usage
```tsx
<Input type="email" placeholder="you@example.com" />
<Input type="password" placeholder="Enter password" />
<Input type="text" value={value} onChange={handleChange} />
```

#### With Label
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

#### States
```tsx
// Disabled
<Input disabled placeholder="Disabled input" />

// With error (add custom styling)
<Input className="border-destructive" placeholder="Error state" />

// Full width
<Input className="w-full" />
```

#### Common Input Types
```tsx
<Input type="text" />       // Text
<Input type="email" />      // Email
<Input type="password" />   // Password
<Input type="number" />     // Number
<Input type="tel" />        // Telephone
<Input type="url" />        // URL
<Input type="search" />     // Search
<Input type="date" />       // Date picker
```

---

### 3. Label Component

**Location**: `client/src/components/ui/Label/Label.tsx`

#### Import
```tsx
import Label from '@/components/ui/Label';
```

#### Basic Usage
```tsx
<Label htmlFor="username">Username</Label>
<Input id="username" />
```

#### Complete Form Field
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="you@example.com"
    required
  />
  <p className="text-sm text-muted-foreground">
    We'll never share your email.
  </p>
</div>
```

#### Best Practices
- ✅ Always use `htmlFor` prop matching input's `id`
- ✅ Place Label above Input for better UX
- ✅ Use `text-destructive` for error labels
- ❌ Don't skip labels - they're critical for accessibility

---

### 4. Card Component

**Location**: `client/src/components/ui/Card/Card.tsx`

#### Import
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
```

#### Basic Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description or subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

#### Card with Footer
```tsx
<Card>
  <CardHeader>
    <CardTitle>Channel Name</CardTitle>
    <CardDescription>12 / 50 participants</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Live video streaming channel</p>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Join Channel</Button>
  </CardFooter>
</Card>
```

#### Card with Icons
```tsx
import { Video, Users } from 'lucide-react';

<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Video className="size-5" />
      Live Channel
    </CardTitle>
    <CardDescription className="flex items-center gap-2">
      <Users className="size-4" />
      24 participants
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Join the conversation</p>
  </CardContent>
</Card>
```

#### Card Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>
    <CardHeader>
      <CardTitle>Card 1</CardTitle>
    </CardHeader>
  </Card>
  <Card>
    <CardHeader>
      <CardTitle>Card 2</CardTitle>
    </CardHeader>
  </Card>
  <Card>
    <CardHeader>
      <CardTitle>Card 3</CardTitle>
    </CardHeader>
  </Card>
</div>
```

#### Interactive Card
```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
</Card>
```

#### Best Practices
- ✅ Use CardHeader for titles and descriptions
- ✅ Use CardContent for main content
- ✅ Use CardFooter for actions (buttons)
- ✅ Add hover effects with `hover:shadow-lg transition-shadow`
- ✅ Use grid layouts for card collections
- ❌ Don't nest Cards unnecessarily

---

### 5. Button Component

**Location**: `client/src/components/ui/Button/Button.tsx`

#### Import
```tsx
import Button from '@/components/ui/Button';
```

#### Variants
| Variant | Use Case | Example |
|---------|----------|---------|
| `default` | Primary actions | Submit, Save, Create |
| `destructive` | Dangerous actions | Delete, Remove, Cancel subscription |
| `outline` | Secondary actions | Cancel, Back, Skip |
| `secondary` | Tertiary actions | Edit, Settings |
| `ghost` | Minimal actions | Navigation, Close |
| `link` | Text links as buttons | Learn more, Read docs |

#### Sizes
| Size | Height | Use Case |
|------|--------|----------|
| `sm` | h-8 | Compact UIs, tables, cards |
| `default` | h-9 | Standard buttons |
| `lg` | h-10 | Hero sections, CTAs |
| `icon` | h-9 w-9 | Icon-only buttons |

#### Examples
```tsx
// Primary action
<Button>Create Channel</Button>

// Destructive action
<Button variant="destructive">Delete Account</Button>

// Outline with large size
<Button variant="outline" size="lg">Cancel</Button>

// Icon button
<Button variant="ghost" size="icon" title="Settings">
  <SettingsIcon />
</Button>

// Disabled state
<Button disabled>Processing...</Button>

// Full width
<Button className="w-full">Sign In</Button>

// As a link (using asChild)
<Button asChild>
  <a href="/channels">View Channels</a>
</Button>
```

### 2. Adding New Shadcn Components

When you need a new component:

1. **Check Shadcn docs**: [ui.shadcn.com](https://ui.shadcn.com/)
2. **Install required dependencies** (if any):
   ```bash
   npm install @radix-ui/react-[component-name]
   ```
3. **Create component file**:
   ```
   client/src/components/ui/ComponentName/
   ├── ComponentName.tsx
   └── index.ts
   ```
4. **Use the official Shadcn code** - Copy from their docs
5. **Update this guide** with usage examples

---

## Utility Classes

### The `cn()` Helper

**Location**: `client/src/lib/utils.ts`

Merges Tailwind classes intelligently, handling conflicts:

```tsx
import { cn } from '@/lib/utils';

// Merge classes with conditional logic
<Button 
  className={cn(
    "w-full",
    isLoading && "opacity-50 cursor-not-allowed",
    isPrimary ? "bg-blue-500" : "bg-gray-500"
  )}
>
  Submit
</Button>
```

### Common Patterns

#### Layout
```tsx
// Flexbox
<div className="flex items-center justify-between gap-4">
  
// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

#### Spacing
```tsx
// Padding
className="p-4"       // All sides
className="px-6 py-4" // Horizontal & Vertical
className="pt-8"      // Top only

// Margin
className="m-4"       // All sides
className="mx-auto"   // Center horizontally
className="mt-8 mb-4" // Top & Bottom

// Gap (for flex/grid)
className="gap-4"
className="gap-x-6 gap-y-4"
```

#### Typography
```tsx
// Sizes
className="text-sm"   // 14px
className="text-base" // 16px
className="text-lg"   // 18px
className="text-xl"   // 20px
className="text-2xl"  // 24px

// Weight
className="font-normal"   // 400
className="font-medium"   // 500
className="font-semibold" // 600
className="font-bold"     // 700
```

#### Colors
```tsx
// Text colors
className="text-foreground"
className="text-muted-foreground"
className="text-primary"
className="text-destructive"

// Background colors
className="bg-background"
className="bg-primary"
className="bg-secondary"
className="bg-accent"
```

#### Responsive Design
```tsx
// Mobile-first approach
className="text-sm md:text-base lg:text-lg"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="hidden md:block"
```

---

## Best Practices

### ✅ DO

- **Use Shadcn components** whenever possible
- **Use semantic color tokens** (`bg-primary` not `bg-blue-500`)
- **Use the `cn()` utility** for conditional classes
- **Follow mobile-first** responsive design
- **Use consistent spacing** (multiples of 4: 4, 8, 12, 16, 20, 24...)
- **Add proper accessibility** attributes (`title`, `aria-label`)
- **Use TypeScript** for all components

### ❌ DON'T

- **Don't create custom buttons** - Use Shadcn Button
- **Don't use inline styles** - Use Tailwind classes
- **Don't use arbitrary colors** - Use design tokens
- **Don't skip accessibility** - Always add labels/titles
- **Don't mix CSS modules** - Stick to Tailwind
- **Don't hardcode values** - Use theme variables

---

## Migration Checklist

When creating or updating components:

- [ ] Replace native HTML elements with Shadcn components
- [ ] Use design tokens for colors (`bg-primary` vs `bg-blue-500`)
- [ ] Apply proper spacing with Tailwind utilities
- [ ] Add responsive classes for mobile/tablet/desktop
- [ ] Include accessibility attributes
- [ ] Use the `cn()` utility for conditional styling
- [ ] Test keyboard navigation
- [ ] Verify dark mode support (if applicable)

---

## Component Library Roadmap

### ✅ Implemented
- Button (all variants)
- Input (all input types)
- Label (form labels)
- Card (with Header, Title, Description, Content, Footer)
- ChannelControls (example component with icons)

### 🎯 Priority Components to Add

1. **Card** - For channel lists, user profiles
2. **Input** - Form fields
3. **Dialog** - Modals and confirmations
4. **Badge** - Status indicators, participant count
5. **Avatar** - User profile pictures
6. **Tooltip** - Hover information
7. **Dropdown Menu** - Settings and options
8. **Switch/Toggle** - On/off controls
9. **Skeleton** - Loading states
10. **Alert** - Important notifications

---

## Resources

- [Shadcn UI Docs](https://ui.shadcn.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [CVA (Class Variance Authority)](https://cva.style/docs)

---

## Examples from Codebase

### ChannelControls Component (with Lucide Icons)
```tsx
import Button from '@/components/ui/Button';
import { Mic, MicOff, Video, VideoOff, Share2, PhoneOff, Users } from 'lucide-react';

<div className="flex items-center justify-center gap-2 p-4">
  {/* Audio toggle */}
  <Button
    variant={audioMuted ? "destructive" : "secondary"}
    size="icon"
    onClick={toggleAudio}
    title={audioMuted ? "Unmute" : "Mute"}
  >
    {audioMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
  </Button>
  
  {/* Participants with count */}
  <Button variant="outline" onClick={showParticipants}>
    <Users className="size-4" />
    <span className="ml-2">{participantCount}</span>
  </Button>
  
  {/* Leave call */}
  <Button variant="destructive" size="icon" onClick={leave}>
    <PhoneOff className="size-4" />
  </Button>
</div>
```

### NavBar Component Pattern
```tsx
<nav>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl">🎥</span>
        <span className="text-xl font-bold">NotWhat</span>
      </Link>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link to="/register">Sign Up</Link>
        </Button>
      </div>
    </div>
  </div>
</nav>
```

### Channel Card Pattern
```tsx
<div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-xl font-semibold mb-2">{channel.name}</h3>
  <p className="text-muted-foreground mb-4">
    {channel.participantCount} / {channel.max_participants} participants
  </p>
  <Button className="w-full">Join Channel</Button>
</div>
```

---

## Support

For questions or issues with styling:
1. Check this guide first
2. Refer to Shadcn UI documentation
3. Check Tailwind CSS documentation
4. Ask the team

**Maintainer**: Development Team  
**Last Review**: December 22, 2024
