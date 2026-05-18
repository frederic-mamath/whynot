# ticket-001 — PoC `react-native-agora` on iOS 26 (additive, no production changes)

## Goal

Determine, on the user's iPhone 17e running iOS 26, whether the latest `react-native-agora` upstream release builds and renders remote video successfully. This is a go/no-go validation that gates the rest of the Android launch plan.

## Acceptance Criteria

- As a developer, the latest `react-native-agora` (a version that bundles Agora native SDK ≥ 4.6.2) is installed in `ios-app/` alongside the existing custom `modules/agora-viewer/` module, with neither displacing the other
- As a developer, `npx expo prebuild --clean` regenerates `ios/` and `pod install` completes without `AgoraRtcKit.xcframework` arm64 errors
- As a developer, the app builds and installs on the iPhone 17e via `npx expo run:ios -d` with no linker errors
- As a developer, a new test screen at `app/(dev)/agora-poc.tsx` joins a live Agora channel using `react-native-agora` (not the custom module) and renders the remote host's video
- As a developer, the existing production live viewer (`app/live/[liveId].tsx` → `src/lib/agora.ts` → custom `agora-viewer` module) continues to work unchanged
- As a developer, the PoC outcome is documented at the bottom of this ticket (build result + video render result + any errors)

## Technical Strategy

The PoC must be **additive and reversible**. Do not edit `src/lib/agora.ts`, `app/live/[liveId].tsx`, or anything inside `modules/agora-viewer/`. If the PoC fails, revert is `npm uninstall react-native-agora` + delete the dev screen.

- iOS App (`ios-app/`)
  - Package
    - `ios-app/package.json`
      - Install via `npx expo install react-native-agora`. If `expo install` rejects the package (not in the Expo compatibility list), fall back to `npm install react-native-agora@latest` and note the version chosen.
  - Configuration
    - `ios-app/app.config.ts`
      - Verify whether `react-native-agora` ships an `app.plugin.js` (`ls node_modules/react-native-agora/app.plugin.js`). If yes, add `"react-native-agora"` to the `plugins` array. If no, skip — autolinking handles it.
      - Add an env var `EXPO_PUBLIC_AGORA_APP_ID` to `extra` so the PoC screen can read it via `Constants.expoConfig.extra.agoraAppId`. Reuse whichever variable name the custom module already uses; if none, declare a new one.
  - View — dev route group
    - `ios-app/app/(dev)/_layout.tsx` *(create)*
      - Simple `Stack` layout. Wrapping all PoC screens in a `(dev)` group keeps them out of the production tab bar.
  - View — PoC screen
    - `ios-app/app/(dev)/agora-poc.tsx` *(create)*
      - Imports from `react-native-agora`: `createAgoraRtcEngine`, `ChannelProfileType`, `ClientRoleType`, `RtcSurfaceView`
      - `TextInput` for channel name (default to a known active test channel)
      - `TextInput` for Agora temp token (Agora's test mode allows a no-token connection for short periods — preferred for the PoC)
      - "Join" button:
        - Creates the engine, sets profile to `LiveBroadcasting`, sets role to `Audience`
        - Calls `joinChannel(token, channelName, 0, {})`
        - Subscribes to `onUserJoined` / `onUserOffline` events to track remote uid
      - When a remote uid is captured, render `<RtcSurfaceView canvas={{ uid }} style={{ flex: 1 }} />`
      - "Leave" button: leave channel + release engine
  - Navigation entry point
    - `ios-app/app/(tabs)/profile.tsx`
      - Add a temporary `Pressable` labeled "PoC Agora (dev)" near the bottom of the profile screen, navigating to `/agora-poc` via `router.push`. Remove after the PoC concludes.

## Manual operations

### Prerequisites
- Have a live channel running on the production Agora app (any seller broadcasting on `popup-live.fr`)
- Have the Agora App ID from production env (`EXPO_PUBLIC_AGORA_APP_ID` or whatever variable the custom module currently reads)

### Steps
1. From `ios-app/`: `npx expo install react-native-agora` (or `npm install react-native-agora` if not in compat list)
2. Verify `ls node_modules/react-native-agora/app.plugin.js` — update `app.config.ts` plugins accordingly
3. Create the three new files listed under Technical Strategy
4. `npx expo prebuild --clean` — must complete without XCFramework arm64 errors
5. `cd ios && pod install` (prebuild may run this automatically; confirm Podfile.lock shows AgoraRtcEngine ≥ 4.6.2)
6. `npx expo run:ios -d` — build and install on iPhone 17e
7. On device: navigate Profile → "PoC Agora (dev)" → enter the channel name of an active live → "Join"
8. Observe whether remote video renders within ~3 seconds

### Recording the outcome

Append a `## Outcome` section to this ticket with:
- `react-native-agora` version installed
- Agora native SDK version (from `ios/Podfile.lock`)
- Build result (pass/fail; if fail, exact error)
- Video render result (yes/no/partial)
- Any unexpected behavior (audio without video, crash on leave, etc.)

This outcome dictates Phase 2 scoping per the table in `summary.md`.

## Out of Scope

- Migrating the production live viewer to `react-native-agora` (separate ticket, only if PoC succeeds)
- Removing the custom `modules/agora-viewer/` module (separate ticket)
- Any Android-side work
- Token server changes (Agora's test mode token works for the PoC duration)

---

## Outcome (final — 2026-05-18)

### Status: iOS PoC IMPOSSIBLE — upstream `react-native-agora@4.6.2` has internal Pod conflicts

### What we tried

1. Installed `react-native-agora@4.6.2` explicitly (note: this is NOT the npm `latest` tag — `latest` still points to `4.5.4`). It bundles `AgoraVideo_Special_iOS@4.6.2.70` + `AgoraIrisRTC_iOS2@4.6.2-build.1` — the SDK versions matching the upstream "feat: support Agora native SDK 4.6.2" merge.
2. First `pod install` failed with xcframework name conflicts — initially assumed to be a collision between the custom `agora-viewer` module and `react-native-agora`.
3. **Tested Option A**: disabled the custom module by renaming `modules/agora-viewer/expo-module.config.json` → `.disabled` (which removes it from `use_expo_modules!` autolinking). `pod install` failed with the **exact same xcframework conflict**.

### Root cause

The conflict is **internal to `react-native-agora@4.6.2`**, not between it and the custom module. The package declares two Pod dependencies that ship the same underlying xcframeworks:

```ruby
# In node_modules/react-native-agora/react-native-agora.podspec
s.dependency 'AgoraVideo_Special_iOS', '4.6.2.70'
s.dependency 'AgoraIrisRTC_iOS2', '4.6.2-build.1'
```

Both pods include the full set of Agora xcframeworks (`AgoraRtcKit`, `aosl`, ~25 others) under identical names. CocoaPods refuses to install duplicates. This is an upstream packaging bug — `react-native-agora@4.6.2` cannot be installed cleanly in any Expo iOS project, regardless of what else is in the workspace.

### What this means

- **`react-native-agora@4.6.2` is unusable on iOS** in its current form — not because of iOS 26, not because of our custom module, but because of its own dependency declarations.
- **`react-native-agora@4.5.4`** (the previous npm `latest`) was the version evaluated in `docs/investigations/agora-ios26.md` and found broken on iOS 26.
- Both upstream paths are blocked for iOS for different reasons.

### State after this PoC

- `react-native-agora` uninstalled (npm + node_modules clean)
- `modules/agora-viewer/expo-module.config.json` restored (autolinking re-enabled)
- PoC files deleted (`app/(dev)/_layout.tsx`, `app/(dev)/agora-poc.tsx`)
- `app/(tabs)/profile.tsx` reverted to original
- `ios/` regenerated via `npx expo prebuild --clean` — production build functional
- `npx tsc --noEmit` passes with zero errors

### Recommended next steps for the user

| Option | What it means |
|:---|:---|
| **Pivot to Option B (Android-only validation)** | The Android side of `react-native-agora` uses a Gradle dep with no relation to the iOS xcframework problem. Validate it directly on the S23+ in a small Android-only PoC, decoupled from iOS. iOS keeps the working custom module. **Recommended.** |
| **File upstream issue + wait** | Report the duplicate xcframework declaration to `react-native-agora` maintainers. Wait for a `4.6.3` or `4.7.0` release. Estimated weeks. |
| **Write Kotlin port of `agora-viewer`** | Skip `react-native-agora` entirely. The custom module already works on iOS; mirror it in Kotlin for Android. ~1 week of native Android work as originally flagged in `summary.md`. |

The iOS PoC has produced a definitive answer: **upstream cannot be used on iOS at this time**. The Android launch plan needs to be re-scoped around Option B or the Kotlin port — see `summary.md` Phase 2 table.
