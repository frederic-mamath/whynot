# CLAUDE.md — app/

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

No test framework is configured. Verification is manual review + build check.

## Stack

**Backend**: Node.js + Express + tRPC + Kysely (PostgreSQL)
**Frontend**: React 18 + Vite + Tailwind CSS v4 + Shadcn UI
**Real-time**: WebSockets (chat/bids) + Agora RTC (live video)
**Payments**: Stripe (checkout, webhooks, payouts)
**Auth**: JWT (mobile/API) + Passport.js sessions (web) + OAuth (Google, Apple)
**Images**: Cloudinary

## Directory Tree

```
app/
├── src/              # Express backend (see app/src/CLAUDE.md)
│   ├── index.ts      # Server entry point (Express + WebSocket + background jobs)
│   ├── trpc.ts       # tRPC initialization
│   ├── routers/      # tRPC routers (auth, auction, live, payment, shop, …)
│   ├── repositories/ # Data-access classes (Repository Pattern, Kysely ORM)
│   ├── db/           # Kysely connection + TypeScript table types
│   ├── services/     # Business logic (Stripe, email, password reset)
│   ├── utils/        # Shared utilities (auth, fees, logger)
│   ├── middleware/   # Security headers, rate limiting, shop-owner auth
│   ├── websocket/    # WebSocket server + broadcast system
│   └── jobs/         # Background jobs (auction processor)
└── client/src/       # React frontend (see app/client/CLAUDE.md)
    ├── App.tsx        # Root component with React Router routes
    ├── pages/         # One component per route
    ├── components/    # Layout components + Shadcn UI components (ui/)
    ├── hooks/         # Shared custom hooks
    ├── lib/           # tRPC client, auth utilities, cn helper
    └── locales/       # i18n translation files
```
