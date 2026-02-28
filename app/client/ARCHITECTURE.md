# Client Architecture

## Directory Structure

```
client/src/
├── components/
│   ├── <LayoutComponent>/
│   │   ├── <ComponentName>/
│   │   │   ├── index.ts
│   │   │   └── <ComponentName>.tsx
│   │   └── NavBar/              # Example
│   │       ├── index.ts
│   │       └── NavBar.tsx
│   └── ui/                      # Design system components
│       └── <shadcn-component-name>.tsx
├── pages/
│   └── <PageName>Page.tsx
├── lib/
│   ├── trpc.ts                  # tRPC client setup
│   ├── auth.ts                  # Token management
│   └── utils.ts                 # Utilities (cn helper, etc.)
├── App.tsx                       # Root component with routing
├── main.tsx                      # Entry point
└── index.css                     # Global styles & Tailwind imports
```

## Component Guidelines

### Layout Components
- Located in `components/<LayoutComponent>/<ComponentName>/`
- Reusable across pages
- Each has own directory with index.ts for clean imports
- Examples: NavBar, Footer, Sidebar

### UI Components
- Located in `components/ui/`
- Base components from **Shadcn** customized with **Tailwind CSS**
- Check here first before creating custom components
- If not found, check [Shadcn documentation](https://ui.shadcn.com/)

### Pages
- Located in `pages/`
- Named with `Page` suffix (e.g., `DashboardPage.tsx`)
- One component per route
- Handle page-level logic and composition

## Styling

**See [STYLING.md](../STYLING.md)** for:
- Tailwind CSS usage
- Shadcn component integration
- Design system tokens
- Responsive design patterns
- Lucide icons usage

## Key Patterns

### tRPC Client
```tsx
import { trpc } from '../lib/trpc';

// Query
const { data } = trpc.auth.me.useQuery();

// Mutation
const mutation = trpc.auth.login.useMutation({
  onSuccess: (data) => { /* ... */ }
});
```

### Authentication
```tsx
import { isAuthenticated, getToken } from '../lib/auth';

// Check auth status
if (!isAuthenticated()) navigate('/login');

// Get token for headers
const token = getToken();
```

### Routing
- Client-side routing via React Router
- Protected routes check auth in useEffect
- Redirects handled programmatically

## State Management

- **Server State**: React Query via tRPC hooks (automatic caching)
- **Local State**: useState for form inputs and UI toggles
- **Persistent State**: localStorage for JWT tokens

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn** - Component library
- **Lucide React** - Icons
- **React Router** - Routing
- **TanStack Query** - Server state
- **tRPC** - Type-safe API client
