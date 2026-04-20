# ticket-004 — Home + Lives Discovery

## Acceptance Criteria

- As a buyer, on the Home tab, I should see up to 4 active lives and a "next scheduled live" banner
- As a buyer, on the Lives tab, I should see all active and upcoming lives, filterable by category
- As a buyer, when I tap a live card, I should navigate to the live detail screen (placeholder for now)

## Technical Strategy

- Frontend
  - `src/components/LiveCard.tsx`
    - Props: `live` (id, title, sellerName, coverImageUrl, viewerCount, status)
    - Shows cover image, seller name, viewer count, LIVE badge if active
    - Pressable → navigate to `/live/[liveId]`
  - `app/(tabs)/index.tsx` — Home screen
    - `trpc.live.list.useQuery({ limit: 4 })` → active lives grid (2-column)
    - `trpc.live.nextScheduled.useQuery()` → upcoming banner (if no active lives, show "next live at HH:mm")
    - `trpc.shop.listSellers.useQuery({ limit: 6 })` → horizontal sellers scroll
    - Pull-to-refresh on all queries
  - `app/(tabs)/lives.tsx` — Lives Discovery
    - `trpc.live.listDiscovery.useQuery()` → all active + upcoming
    - Category filter: horizontal chip row (All, Fashion, Beauty, Home, etc.)
    - Filters applied client-side on the query result
    - FlatList of `LiveCard` components
  - `app/live/[liveId].tsx` — placeholder
    - Shows `liveId` param + "Live stream coming soon" text
    - Back button

## tRPC Procedures

- `live.list(limit?)` → active lives (past 3 hours, not ended)
- `live.listDiscovery()` → active + upcoming lives with category
- `live.nextScheduled()` → next upcoming live
- `shop.listSellers(limit)` → sellers list for discovery row

## Manual Operations

- None
