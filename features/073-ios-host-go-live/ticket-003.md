# Ticket 003 — Auto-route hosts away from the buyer view of their own live

## Goal

When a seller taps their own live from the Home feed (or any other entry point that lands on `app/live/[liveId].tsx`), redirect them to `/seller-live/[id]` so they enter broadcaster mode instead of seeing the buyer view of their own live.

## Acceptance Criteria

- As a seller (host), when I tap my own live from the Home feed, I land on the seller-live screen — not the buyer screen — and my camera preview appears (per ticket 002)
- As a buyer (non-host), when I tap any live from the Home feed, I still land on the buyer screen — behaviour unchanged
- As a seller (host), if I deeplink to `/live/<my-channel-id>` directly, I am redirected to `/seller-live/<my-channel-id>` before any video / token logic runs
- The redirect happens before `live.join` is called — no wasted server round-trip on the buyer endpoint
- `npx tsc --noEmit` passes from `ios-app/`

## Technical Strategy

- Frontend
  - Buyer screen — `ios-app/app/live/[liveId].tsx` (modify)
    - At the very top of the component (before any other tRPC call), read the live's `host_id`. Options:
      1. Use the already-queried `trpc.live.get.useQuery({ channelId })` if the page calls it; reuse the result.
      2. If not already queried, add `const liveQuery = trpc.live.get.useQuery({ channelId });` — `live.get` is the lightweight metadata endpoint already used by the seller live detail page (`app/(tabs)/seller/lives/[id].tsx`).
    - Read the authenticated user from `useAuth()` (already in scope on this screen — see `const { user } = useAuth();` around the top of the component).
    - When `liveQuery.data?.channel.host_id === user?.id`, call `router.replace(\`/seller-live/\${channelId}\`)` and return early (render `null` while the navigation kicks in).
    - Use `router.replace`, not `router.push` — the user should not be able to swipe back into the buyer view of their own live.

  - Edge cases to handle
    - `liveQuery` still loading: render the existing loading state, do not call `joinMutation.mutate` yet (or guard it with `enabled: !!liveQuery.data`).
    - `liveQuery` errored: fall through to existing buyer behaviour. The seller-live screen would also fail to load — better to let the buyer-side error path handle it.
    - User logged out (`user === null`): skip the redirect entirely. An anonymous user cannot be a host.

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test
```

Manual:
1. As a seller, schedule a live and start it (via Vendre → Go Live → Démarrer).
2. From a second authenticated buyer account, tap the live in the Home feed → land on the buyer view (unchanged behaviour).
3. Switch back to the seller account, tap the same live from the Home feed → land on the seller-live broadcaster screen, not the buyer view.
4. As the seller, deep-link to `/live/<channelId>` directly via the dev menu or a typed URL → confirm immediate redirect to `/seller-live/<channelId>`.

## Manual operations to configure services

None.
