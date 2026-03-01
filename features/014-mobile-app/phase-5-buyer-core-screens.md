# Phase 5: Buyer Core Screens

## Objective

Implement the main buyer-facing screens: dashboard, channel list, profile (with edit + logout), and orders list with real data from the backend.

## User-Facing Changes

- Dashboard with live channels summary and recent orders
- Channel list with cards (title, host, viewers, live status), pull-to-refresh
- Profile screen with name editing and logout
- Orders list with status badges

## Files to Update

### Frontend (mobile-app/)

- `app/(tabs)/index.tsx` — Dashboard screen
- `app/(tabs)/channels.tsx` — Channel list screen
- `app/(tabs)/profile.tsx` — Profile screen (view/edit + logout)
- `app/(tabs)/orders.tsx` — Orders list screen
- `src/components/ChannelCard.tsx` — Channel card component
- `src/components/OrderCard.tsx` — Order card component
- `src/components/LoadingScreen.tsx` — Full-screen loading indicator
- `src/components/EmptyState.tsx` — Empty state with icon + message

## Steps

1. Create shared components (LoadingScreen, EmptyState)
2. Build ChannelCard and OrderCard components
3. Implement dashboard with live channels query + recent orders
4. Implement channel list with `channel.list` query + pull-to-refresh
5. Implement profile screen with `profile.getProfile` / `profile.updateProfile`
6. Implement orders list with `order.myOrders` query
7. Add logout functionality to profile screen

## Acceptance Criteria

- [ ] Dashboard shows live channels and recent orders from backend
- [ ] Channel list displays all channels with correct status
- [ ] Pull-to-refresh works on channel list and orders
- [ ] Profile displays user info and allows name editing
- [ ] Logout clears token and redirects to login
- [ ] Empty states show when no data available
- [ ] Loading spinners display while fetching data

## Status

📝 PLANNING
