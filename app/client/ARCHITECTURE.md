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
│   └── <PageName>/              # Pages with complex logic use a folder
│       ├── <PageName>.tsx       # View only: JSX + layout
│       └── <PageName>.hooks.ts  # All logic: tRPC, state, side-effects
│   └── <PageName>Page.tsx       # Simple pages can remain a single file
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
- When a page grows in complexity, split it into a folder:
  - `<PageName>.tsx` — pure view: only JSX and layout, no tRPC or business logic
  - `<PageName>.hooks.ts` — all logic extracted into named custom hooks (see [Headless Component pattern](#headless-component-pattern) below)

## Styling

**See [STYLING.md](../STYLING.md)** for:

- Tailwind CSS usage
- Shadcn component integration
- Design system tokens
- Responsive design patterns
- Lucide icons usage

## Key Patterns

### Headless Component Pattern

When a page component grows in complexity, its logic is extracted into **custom hooks** in a co-located `<PageName>.hooks.ts` file. The page component becomes a pure view responsible only for JSX and layout.

Each hook is named after the domain it encapsulates (`useChat`, `useShop`, etc.) and receives only the minimal context it needs (e.g. `liveId`).

```
pages/
└── LiveDetailsPage/
    ├── LiveDetailsPage.tsx       # View: only JSX, imports hooks
    └── LiveDetailsPage.hooks.ts  # Logic: useChat, useShop, ...
```

**`LiveDetailsPage.hooks.ts`**

```ts
export const useChat = (liveId: string | undefined) => {
  const [messageList, setMessageList] = useState([]);
  trpc.message.subscribe.useSubscription(...);
  const sendMessageMutation = trpc.message.send.useMutation(...);
  const onSubmitMessage = (e) => { ... };
  return { messageList, onSubmitMessage };
};

export const useShop = (liveId: string | undefined) => {
  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts } = trpc.product.list.useQuery(...);
  const { data: linkedProducts } = trpc.product.listByChannel.useQuery(...);
  return { myShop, shopProducts, linkedProducts };
};
```

**`LiveDetailsPage.tsx`**

```tsx
const LiveDetailsPage = () => {
  const { liveId } = useParams();
  const { messageList, onSubmitMessage } = useChat(liveId);
  const { shopProducts, linkedProducts } = useShop(liveId);
  return ( /* JSX only */ );
};
```

**Rules:**

- Hooks own all tRPC queries, mutations, subscriptions, and derived state
- The page component contains **no** `trpc.*` calls directly
- Each hook covers one domain/feature (chat, shop, agora, auth…)
- Hooks in `<PageName>.hooks.ts` are page-scoped, not meant to be shared globally (use `src/hooks/` for that)

### tRPC Client

```tsx
import { trpc } from "../lib/trpc";

// Query
const { data } = trpc.auth.me.useQuery();

// Mutation
const mutation = trpc.auth.login.useMutation({
  onSuccess: (data) => {
    /* ... */
  },
});
```

### Authentication

```tsx
import { isAuthenticated, getToken } from "../lib/auth";

// Check auth status
if (!isAuthenticated()) navigate("/login");

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
