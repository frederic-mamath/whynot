# Phase 4: Navigation & App Shell

## Objective

Set up the tab-based navigation with Expo Router, including conditional tabs based on user role (SELLER vs BUYER) and the overall app shell with providers.

## User-Facing Changes

- Bottom tab bar with: Home, Live, Orders, Shop (seller only), Profile
- Consistent theming across all tabs (NativeWind tokens)
- Deep linking via `whynot://` scheme

## Files to Update

### Frontend (mobile-app/)

- `app/(tabs)/_layout.tsx` — Tab navigator with icons and role-based visibility
- `app/(tabs)/index.tsx` — Home tab placeholder
- `app/(tabs)/channels.tsx` — Live tab placeholder
- `app/(tabs)/orders.tsx` — Orders tab placeholder
- `app/(tabs)/shop/index.tsx` — Shop tab placeholder (seller only)
- `app/(tabs)/profile.tsx` — Profile tab placeholder
- `src/hooks/useUserRole.ts` — Hook to check user role (SELLER/BUYER)
- `src/components/TabBarIcon.tsx` — Reusable tab bar icon component

## Steps

1. Create tab layout with 5 tabs and Lucide RN icons
2. Implement `useUserRole` hook using `role.getUserRoles` tRPC query
3. Conditionally show Shop tab for sellers only
4. Create placeholder screens for all tabs
5. Configure deep linking scheme in `app.json`
6. Style tabs with NativeWind tokens

## Acceptance Criteria

- [ ] Tab navigation works between all screens
- [ ] Shop tab visible only for SELLER role
- [ ] Icons and labels display correctly
- [ ] Active tab highlighted with primary color
- [ ] Deep link scheme `whynot://` registered

## Status

📝 PLANNING
