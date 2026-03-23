# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `app/`:

```bash
# Development
npm run dev           # Build + start server
npm run dev:watch     # Hot-reload development server

# Build
npm run build         # Build server + client
npm run build:server  # TypeScript compile only
npm run build:client  # Vite production build

# Database
npm run migrate       # Run Kysely migrations
docker-compose up -d  # Start PostgreSQL + Redis locally (from project root)
```

No test framework is configured.

## Architecture Overview

**WhyNot** is a full-stack live-streaming commerce platform (live auctions, product sales, seller/buyer marketplace).

```
app/
├── src/              # Express backend
│   ├── index.ts      # Server entry point (Express + WebSocket + background jobs)
│   ├── trpc.ts       # tRPC initialization
│   ├── routers/      # 16 tRPC routers (auth, auction, live, payment, shop, …)
│   ├── repositories/ # 25 data-access classes (Repository Pattern, Kysely ORM)
│   ├── db/           # Kysely connection + TypeScript table types
│   ├── services/     # Business logic (Stripe, email, password reset)
│   ├── middleware/   # Security headers, rate limiting, shop-owner auth
│   ├── websocket/    # WebSocket server + broadcast system
│   └── jobs/         # Background jobs (auction processor)
└── client/src/       # React 18 + Vite frontend
    ├── App.tsx        # Root component with React Router routes
    ├── pages/         # One component per route (see naming convention below)
    ├── components/    # Layout components + Shadcn UI components (ui/)
    ├── hooks/         # Shared custom hooks
    ├── lib/           # tRPC client, auth utilities, cn helper
    └── locales/       # i18n translation files
```

**Stack**: Node.js + Express + tRPC + Kysely (PostgreSQL) / React + Vite + Tailwind v4 + Shadcn UI
**Real-time**: WebSockets (chat/bids) + Agora RTC (live video)
**Payments**: Stripe (checkout, webhooks, payouts)
**Auth**: JWT (mobile/API) + Passport.js sessions (web) + OAuth (Google, Apple)
**Images**: Cloudinary

## Key Patterns

### Backend — tRPC + Repository

- All API endpoints are tRPC procedures in `src/routers/`
- Each router delegates to repository classes in `src/repositories/` for DB access
- Kysely provides type-safe queries — table types are in `src/db/types.ts`

### Frontend — Headless Component Pattern

Complex pages split into two files:

```
pages/LiveDetailsPage/
├── LiveDetailsPage.tsx       # Pure view — JSX only, no tRPC calls
└── LiveDetailsPage.hooks.ts  # All logic: tRPC, state, side-effects
```

Each hook covers one domain (`useChat`, `useShop`, `useAuction`, …). Page-scoped hooks live in `.hooks.ts`; reusable hooks go in `src/hooks/`.

Page naming convention: `<Entity><Action>Page.tsx` (e.g. `AuctionListPage`, `ShopCreatePage`).

### Frontend — tRPC Client

```tsx
import { trpc } from "../lib/trpc";

const { data } = trpc.shop.getMyShop.useQuery();
const mutation = trpc.auction.bid.useMutation({ onSuccess: () => {} });
```

### Styling

- **Tailwind CSS v4** with CSS-first config — no `tailwind.config.js`; tokens defined in `client/src/index.css`
- Always use design tokens over raw Tailwind colors: `bg-background`, `text-foreground`, `bg-card`, `text-primary`, `border-border`
- Fonts: `font-outfit` (headings) and `font-syne` via `@theme inline` in `index.css`
- Use `cn()` from `lib/utils` for conditional classes
- Use Shadcn components from `components/ui/` first; add new ones via Shadcn docs
- Icons from Lucide React
- Toast notifications via Sonner: `toast.success(...)`, `toast.error(...)`
- **WelcomePage** (`pages/WelcomePage/WelcomePage.tsx`) is the design-system playground — test palette/typography changes there first
- Mobile-first responsive design using `md:` and `lg:` breakpoints

## Feature Planning

Features are tracked in `features/` with numbered folders (`001-037`). See `features/CLAUDE.md` for the feature-ticketing protocol (atomic daily-deliverable tickets, app must build at every step).
