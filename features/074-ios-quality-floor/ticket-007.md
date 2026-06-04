# Ticket 007 — useAgoraSession extraction

## Goal

Extract the duplicated Agora engine lifecycle (init → join → listen → leave → release) into a single `useAgoraSession({ channelId, role })` hook. Both `app/live/[liveId].tsx` (audience role) and `app/seller-live/[liveId].tsx` (broadcaster role) are migrated.

Today's pattern has a real bug surface: cleanup `useEffect` returns an unawaited async function, holds a stale `channelId` closure, and the leave mutation is fire-and-forget. The hook owns awaited teardown, scoped refs, and proper effect dependencies.

The hook also folds in `useMutationWithToast` from T-005 for `live.join` and `live.leave` failures.

## Acceptance Criteria

- As a buyer, when I leave a live screen and re-enter (same or different live), the video feed renders cleanly without a stale frame from the previous session
- As a buyer, when I background the app during a live and return, the engine reconnects cleanly
- As a seller, when I leave the broadcaster screen, the local camera releases properly (no battery drain or green status-bar indicator after exit)
- As a developer, the Agora lifecycle exists in exactly one file
- As a developer, `react-hooks/exhaustive-deps` passes on both live screens (ESLint from T-002)

## Technical Strategy

- Frontend / Hook
  - `ios-app/src/hooks/useAgoraSession.ts`
    - Signature: `useAgoraSession({ channelId: number, role: "audience" | "broadcaster", enabled?: boolean })`
    - Returns: `{ engine: AgoraEngine | null, joined: boolean, remoteUid: number | null, localUid: number | null, error: string | null }`
    - Internals: ref-managed engine instance, listener registration on successful join, awaited `leaveChannel()` + `release()` on cleanup, calls `trpc.live.join.useMutation` and `trpc.live.leave.useMutation` wrapped with `useMutationWithToast`
    - Stable effect deps: `[channelId, role, enabled]`
- Frontend / Migration
  - `ios-app/app/live/[liveId].tsx`
    - Remove: `engineRef`, `joinMutation`, `leaveMutation`, cleanup `useEffect`, listener-setup `useEffect`
    - Replace with: `const { joined, remoteUid } = useAgoraSession({ channelId, role: "audience", enabled: liveStatus === "active" });`
    - Keep: liveStatus logic, subscription handling, UI
  - `ios-app/app/seller-live/[liveId].tsx`
    - Same migration: replace `initializeBroadcaster` / `joinChannelAsBroadcaster` / `stopBroadcaster` calls + their refs with `useAgoraSession({ channelId, role: "broadcaster" })`
    - Keep: broadcasting controls (start CTA, end CTA), auction creation, chat — only the engine lifecycle moves
- Native module
  - `ios-app/src/lib/agora.ts` — confirm the public surface (`createAgoraRtcEngine`, `RtcSurfaceView`, etc.) is what the new hook needs; no API changes expected

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint
```

Manual: enter a live → leave → enter another → confirm no stale video. Enter as seller → leave → confirm camera releases (Xcode Memory Graph or the absence of the green camera-active iOS indicator). Background the app during a live → return → video continues.

## Manual operations to configure services

None.
