# Ticket 007 — Agora broadcaster native module

## Goal

The current `modules/agora-viewer` native module is hardcoded to the audience role. This ticket extends it to support broadcaster (host) mode: local camera preview, audio/video publishing, and the host client role. This is the prerequisite for ticket 008 — the go live screen.

## Acceptance Criteria

- As a developer, I can call `initializeBroadcaster()` to set up Agora in host mode (camera + microphone enabled, client role = broadcaster)
- As a developer, I can render a `<RtcLocalView />` component to show the seller's local camera feed
- As a developer, I can call `joinChannelAsBroadcaster(token, channelName, uid)` to publish the stream
- Existing viewer flow (audience) is unaffected — `initialize()` and `joinChannel()` still work exactly as before
- `npx tsc --noEmit` passes with zero errors

## Technical Strategy

- Swift — `ios-app/modules/agora-viewer/ios/AgoraViewerModule.swift` (modify)
  - Add `AsyncFunction("initializeBroadcaster")`:
    - Same `AgoraDelegate` setup as `initialize()`
    - `engine.setChannelProfile(.liveBroadcasting)`
    - `engine.setClientRole(.broadcaster)`
    - `engine.enableVideo()`
    - `engine.enableAudio()`
    - `engine.startPreview()` — starts local camera
  - Add `AsyncFunction("stopBroadcaster")`:
    - `engine.stopPreview()`
    - then same release logic as `release()`
  - Modify `AsyncFunction("joinChannel")` — add optional `role: Int` param (default `2` = audience); if `role == 1` set `options.clientRoleType = .broadcaster`, publish local streams
    - Alternatively add separate `AsyncFunction("joinChannelAsBroadcaster")` to avoid breaking existing callers — prefer this approach to avoid regressions

- Swift — `ios-app/modules/agora-viewer/ios/AgoraViewerView.swift` (modify)
  - Add a `local: Bool` prop (default `false`)
  - When `local == true`: render `engine.setupLocalVideo(canvas)` instead of `setupRemoteVideo`
  - The existing `uid` prop on remote view is still used for audience; local view ignores it

- TypeScript — `ios-app/src/lib/agora.ts` (modify)
  - Export `ClientRoleBroadcaster = 1` alongside existing `ClientRoleAudience = 2`
  - Export `initializeBroadcaster: () => Promise<void>` — calls native `AgoraViewer.initializeBroadcaster()`
  - Export `stopBroadcaster: () => Promise<void>`
  - Export `joinChannelAsBroadcaster: (token, channelName, uid) => Promise<void>`
  - `RtcLocalView`: a thin wrapper around `<RtcSurfaceView local={true} uid={0} />` — or export `RtcSurfaceView` with a new `local` prop baked in

- Note: `npx expo prebuild --clean` is NOT required — the native module already exists in the build. Only Swift source changes are made, and the module rebuilds on next `expo run:ios`.

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual: plug in a device, open the stub go-live screen (ticket 006), verify local camera preview appears without crashing. Audio/video publishing is validated end-to-end in ticket 008.

## Manual operations to configure services

None.
