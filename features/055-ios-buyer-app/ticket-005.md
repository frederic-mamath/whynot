# ticket-005 — Live Viewer (Agora Video)

## ⚠ Important: Requires Custom Dev Build

After installing `react-native-agora`, the app can no longer run in Expo Go. You must build a custom dev client:

```bash
cd ios-app
npx expo run:ios   # builds native iOS app and opens in Simulator
```

This requires Xcode to be installed. First time takes ~10 minutes.

## Acceptance Criteria

- As a buyer, on the live detail screen, I should see the seller's video stream filling the screen
- As a buyer, when I back out of the live, the Agora engine should be cleaned up (no background audio/video)
- As a developer, `npx expo run:ios` completes without errors

## Technical Strategy

- Frontend
  - `package.json`: add `react-native-agora`
  - `app.config.ts`
    - Add `react-native-agora` to `plugins` array (Config Plugin handles native setup)
    - Add `infoPlist.NSCameraUsageDescription`: "Required for live streaming" (Apple requires this even for viewers)
    - Add `infoPlist.NSMicrophoneUsageDescription`: "Required for live streaming"
  - `app/live/[liveId].tsx` — full-screen live viewer
    - `useLocalSearchParams<{ liveId: string }>()` to get ID
    - `trpc.live.join.useMutation()` on mount → `{ token, appId, uid, channel }`
    - `createAgoraRtcEngine()` → `engine.initialize({ appId, channelProfile: ChannelProfileLiveBroadcasting })`
    - `engine.setClientRole(ClientRoleAudience)` — viewer only, no local camera
    - `engine.enableVideo()`
    - `engine.joinChannel(token, channel.id.toString(), uid, { autoSubscribeVideo: true, autoSubscribeAudio: true })`
    - `onUserJoined` listener → set `remoteUid` state → render `RtcSurfaceView`
    - `onUserOffline` listener → clear `remoteUid`
    - Cleanup on unmount/back: `engine.leaveChannel()` + `engine.removeAllListeners()` + `engine.release()`
    - `trpc.live.leave.useMutation()` on exit
    - While `remoteUid` is null: show "Waiting for host..." placeholder
  - `src/components/live/LiveBadge.tsx`
    - Props: `viewerCount: number`
    - `trpc.live.participants.useQuery({ channelId }, { refetchInterval: 10_000 })`
    - Red "LIVE" pill + viewer count

## tRPC Procedures

- `live.join(channelId)` → `{ token, appId, uid, channel: { id, ... } }`
- `live.participants(channelId)` → `{ length: number }` (array of participants)
- `live.leave(channelId)` → void

## Manual Operations

- **Agora App ID**: copy `AGORA_APP_ID` value from `app/.env` → add to `ios-app/.env` as `EXPO_PUBLIC_AGORA_APP_ID`
- `app.config.ts` reads this via `process.env.EXPO_PUBLIC_AGORA_APP_ID` and passes it to `live.join` (backend generates the token — no client-side Agora key needed beyond what the backend returns)
