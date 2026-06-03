# Ticket 002 — iOS seller-live calls `live.start`

## Goal

Rewire `ios-app/app/seller-live/[liveId].tsx` from `live.join` to the new `live.start` mutation introduced in ticket 001. After this ticket, the host can tap "Go Live" at any time — before, at, or after the scheduled `starts_at` — and reach the broadcaster screen with their camera preview rendering.

## Acceptance Criteria

- As a seller (host), when I tap "Go Live" on an upcoming live, the seller-live screen mounts and my camera preview appears within a few seconds — no "live didn't start yet" alert
- As a seller (host), when I tap "Démarrer le live" on the seller-live screen, my stream goes live to viewers and the existing auction / highlight / chat panels behave exactly as they do today (no regression of the ticket 008 surface)
- As a seller (host), if `live.start` fails for any reason (network, server error), I see an `Alert.alert` with the server's error message and I am returned to the previous screen
- As a seller, the seller-live screen no longer references `live.join` at all
- The buyer-side `app/live/[liveId].tsx` is unchanged — it still calls `live.join`
- `npx tsc --noEmit` passes from `ios-app/`
- `npm run arch:test` passes from `ios-app/` (R4 hex rule still clean)

## Technical Strategy

- Frontend
  - Screen — `ios-app/app/seller-live/[liveId].tsx` (modify)
    - Replace `const joinMutation = trpc.live.join.useMutation();` with `const startMutation = trpc.live.start.useMutation();`
    - In the existing init `useEffect`, replace the `joinMutation.mutateAsync({ channelId })` call (around line 130 in the current file) with `startMutation.mutateAsync({ channelId })`
    - Delete the `if (data.liveStatus !== "active") { Alert.alert(...); router.back(); return; }` branch — `live.start` always returns `"active"` on success per ticket 001; failure surfaces via the existing `try/catch` already wrapping the call
    - The shape of the returned payload (`{ token, appId, uid, channel }`) matches what `live.join` returned, so the downstream `setJoinData({...})` and `initializeBroadcaster(active.appId)` blocks need no changes
    - Audit imports: remove anything that becomes unused (e.g. the inline `"upcoming" | "active" | "ended"` type narrowing if no longer referenced)

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test
```

Manual (requires the host to actually broadcast — works on a physical device, simulator camera is fake/black):
1. Schedule a live for `now + 1 hour` via Vendre → Lives → "+".
2. Open the seller live detail page, tap "Go Live".
3. The seller-live screen mounts; within ~3 seconds the local camera preview fills the screen — no error alert.
4. Tap "Démarrer le live" → broadcast starts; on a second device opening the same live as a buyer, the video appears.
5. From the seller side: tap a product → highlight banner appears on the buyer device. Launch an auction → countdown appears on both sides. End the live → both sides return to their previous screen cleanly.

## Manual operations to configure services

None.
