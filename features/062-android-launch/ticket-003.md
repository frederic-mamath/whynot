# ticket-003 — Wire Agora Android SDK into agora-viewer Kotlin module

## Goal

Replace the stub from ticket-002 with the real Agora Android SDK implementation. After this ticket, a buyer on Android can join a live channel and see the seller's video — feature parity with iOS.

## Acceptance Criteria

- As a developer, the Agora Android SDK is declared in `modules/agora-viewer/android/build.gradle` as a Maven dependency, version matching the iOS `AgoraRtcEngine_iOS` Pod from `modules/agora-viewer/agora-viewer.podspec`
- As a developer, `AgoraViewerModule.kt` implements the same four async functions as the iOS Swift implementation: `initialize(appId)`, `joinChannel(token, channelName, uid)`, `leaveChannel()`, `release()`
- As a developer, a custom `IRtcEngineEventHandler` bridges Agora's `onUserJoined(uid, elapsed)` and `onUserOffline(uid, reason)` callbacks back to JS via `sendEvent` with the same payload shape the iOS module sends
- As a developer, `AgoraViewerView.kt` defines a `uid` prop. When the prop is set, the view attaches a `SurfaceView` child and calls `engine.setupRemoteVideo(VideoCanvas(surfaceView, RENDER_MODE_HIDDEN, uid))`
- As a developer, no JS-side changes are required — `ios-app/src/lib/agora.ts` continues to work transparently via `requireNativeModule("AgoraViewer")`
- As a buyer on Android (emulator or S23+), I navigate to an active live channel from the Lives tab and see the seller's video stream rendered full-screen
- As a developer, `npx tsc --noEmit` passes; `npx expo run:android -d` builds and installs without errors; the iOS build still works
- As a developer, leaving a live (`router.back()` from the live screen) does not crash the app — `release()` is called and `sharedEngine` is reset

## Technical Strategy

The Android implementation mirrors the iOS Swift module structure documented in `docs/investigations/agora-ios26.md > Final file structure`. Two source files, file-level shared engine pattern, separate event handler class.

- iOS App (`ios-app/`)
  - Module dependencies
    - `modules/agora-viewer/android/build.gradle`
      - Add `implementation 'io.agora.rtc:full-sdk:<version>'` where `<version>` matches the iOS Pod version. To find the iOS version: `grep AgoraRtcEngine modules/agora-viewer/agora-viewer.podspec`. Use the same major.minor on Android.
  - Android implementation
    - `modules/agora-viewer/android/src/main/java/expo/modules/agoraviewer/AgoraViewerModule.kt`
      - Replace the stub with full implementation:
        - `companion object { var sharedEngine: RtcEngine? = null }` — file-level shared engine so the View can access it from a different file (mirrors iOS Swift `sharedEngine` pattern)
        - `definition()` block:
          - `Name("AgoraViewer")`
          - `Events("onUserJoined", "onUserOffline")`
          - `AsyncFunction("initialize") { appId: String -> ... }` — create event handler, then `RtcEngine.create(reactContext, appId, handler)`, set `setChannelProfile(LIVE_BROADCASTING)`, `enableVideo()`, store in `sharedEngine`
          - `AsyncFunction("joinChannel") { token: String?, channelName: String, uid: Int -> ... }` — `setClientRole(AUDIENCE)`, `joinChannel(token, channelName, "", uid)`
          - `AsyncFunction("leaveChannel") { -> sharedEngine?.leaveChannel() }`
          - `AsyncFunction("release") { -> RtcEngine.destroy(); sharedEngine = null }`
          - `View(AgoraViewerView::class) { Prop("uid") { view, uid: Int -> view.setRemoteUid(uid) } }`
      - Private `inner class AgoraEventHandler : IRtcEngineEventHandler()`:
        - Override `onUserJoined(uid: Int, elapsed: Int)` → `sendEvent("onUserJoined", bundleOf("uid" to uid, "elapsed" to elapsed))`
        - Override `onUserOffline(uid: Int, reason: Int)` → `sendEvent("onUserOffline", bundleOf("uid" to uid, "reason" to reason))`
    - `modules/agora-viewer/android/src/main/java/expo/modules/agoraviewer/AgoraViewerView.kt`
      - Extends `ExpoView`
      - `setRemoteUid(uid: Int)` method called from the View prop setter:
        - Removes any previous `SurfaceView` children
        - Creates a new `SurfaceView`, adds it via `addView(surfaceView, LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)`
        - Calls `AgoraViewerModule.sharedEngine?.setupRemoteVideo(VideoCanvas(surfaceView, VideoCanvas.RENDER_MODE_HIDDEN, uid))`

## Manual operations

### Resolve the Agora Android SDK version

```bash
grep AgoraRtcEngine /Users/fredericmamath/freelance/whynot/ios-app/modules/agora-viewer/agora-viewer.podspec
```

Match the major.minor of the iOS Pod. Agora's Android SDK Maven coordinates: `io.agora.rtc:full-sdk:<version>`. Available versions: **https://central.sonatype.com/artifact/io.agora.rtc/full-sdk**.

### Build & test

From `ios-app/`:

```bash
npx expo prebuild --clean
npx expo run:android          # emulator or attached device
```

Test flow:
1. Log in to the buyer account
2. Open the Lives tab
3. Tap an active live (a seller must be broadcasting on `popup-live.fr`)
4. Verify the seller's video appears within ~3 seconds
5. Tap the back button — app should not crash

**Emulator caveats**: video may decode slower than on a real device, and frame rate can drop on lower-spec host machines. Audio quality is also degraded. Functional verification is what matters here — quality validation needs a real device.

### If video does not render

Common failure modes to check (mirroring iOS investigation):
- `adb logcat | grep -i agora` for SDK initialization errors
- Verify Internet permission in the generated `android/app/src/main/AndroidManifest.xml` (Agora needs it)
- Verify the channel name matches what the seller is broadcasting on
- Check that `joinChannel` returned 0 (success) rather than a negative error code

## Out of Scope

- Audio publishing from the buyer side (we're audience-only, mirrors iOS scope)
- Quality / bitrate tuning
- Network reconnection edge cases (Agora SDK handles automatic reconnect by default)
- Google Pay / payment changes (ticket-004)
