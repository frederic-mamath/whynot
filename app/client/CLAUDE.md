# CLAUDE.md — app/client/

## Headless Component Pattern

Every page is split into two files — no exceptions:

```
pages/LiveDetailsPage/
├── LiveDetailsPage.tsx       # Pure view — JSX only, no tRPC calls, no useState, no useEffect
└── LiveDetailsPage.hooks.ts  # All logic: tRPC queries/mutations, state, handlers, side-effects
```

**Rules:**
- `Page.tsx` imports the hook and renders JSX using the returned values — nothing else
- `Page.hooks.ts` exports a single `use<PageName>()` hook as its main export
- Page-scoped hooks live in `.hooks.ts`; reusable hooks go in `src/hooks/`
- Page naming convention: `<Entity><Action>Page.tsx` (e.g. `AuctionListPage`, `ShopCreatePage`)

All pages follow this pattern after Feature 043, including single-query pages.

## tRPC Client

Import from `lib/trpc` — never call fetch directly:

```tsx
import { trpc } from "../lib/trpc";

// In a .hooks.ts file:
const { data, isLoading } = trpc.shop.getMyShop.useQuery();
const mutation = trpc.auction.bid.useMutation({ onSuccess: () => {} });
```

tRPC calls belong exclusively in `.hooks.ts` files, never in `.tsx` view files.

## Styling

**Tailwind CSS v4** — CSS-first config, no `tailwind.config.js`. Tokens defined in `client/src/index.css`.

### Always use design tokens — never raw Tailwind color classes

| Purpose | Token | Do NOT use |
|---------|-------|------------|
| Background | `bg-background` | `bg-white`, `bg-zinc-900` |
| Text | `text-foreground` | `text-black`, `text-white` |
| Card surface | `bg-card` | — |
| Primary brand | `bg-primary`, `text-primary` | `bg-indigo-500` |
| Border | `border-border` | `border-gray-200` |
| Success state | `bg-success`, `text-success` | `bg-green-500`, `text-green-600` |
| Warning state | `bg-warning`, `text-warning` | `bg-amber-500`, `text-yellow-600` |
| Info state | `bg-info`, `text-info` | `bg-blue-500`, `text-blue-600` |
| Error/destructive | `bg-destructive`, `text-destructive` | `bg-red-500`, `text-red-600` |

The semantic tokens `success`, `warning`, `info` were added in Feature 043. Use them for all status badges, icons, and indicators.

### Other styling rules

- Use `cn()` from `lib/utils` for conditional classes
- Use Shadcn components from `components/ui/` first; add new ones via Shadcn docs
- Icons from Lucide React
- Toast notifications via Sonner: `toast.success(...)`, `toast.error(...)`
- Fonts: `font-outfit` (headings), `font-syne` (body) — applied via `@theme inline` in `index.css`
- Mobile-first responsive design using exactly **two breakpoints** — see Breakpoint System below
- **WelcomePage** (`pages/WelcomePage/WelcomePage.tsx`) is the design-system playground — test palette/typography changes there first

## Breakpoint System

The app uses **exactly two breakpoints**. No others.

| Breakpoint | Tailwind prefix | Min-width | Layout |
|---|---|---|---|
| Mobile | *(base)* | 0px | BottomNav, full-width content |
| Desktop | `md:` | 768px | TopNav, content max-width 1024px |

**Rules:**
- Every responsive class must use `md:` — never `sm:`, `lg:`, `xl:`, or `2xl:` for layout decisions
- Navigation switch: BottomNav = `md:hidden` / TopNav desktop links = `hidden md:flex`
- Content container: `md:max-w-[1024px] md:mx-auto`
- There must never be a viewport width where both BottomNav and TopNav are simultaneously visible

The `md` (768px) boundary was chosen deliberately over `lg` (1024px) to avoid browser scrollbar width (~15px) causing both navbars to appear at the same time at 1024px viewport.

## Routing

Routes are defined in `App.tsx`. Each route maps to exactly one page component. Protected routes use the `<ProtectedRoute>` wrapper.
