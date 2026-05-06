# Agora iOS 26 Investigation

> Last updated: 2026-05-06 — **resolved**

## TL;DR — Shortest path when a React Native library is incompatible with iOS

When a native library (e.g. `react-native-agora`) ships a pre-built XCFramework that is broken on a new iOS version, the fastest reliable path is to **write a minimal custom Expo native module** that calls the vendor's official CocoaPod directly. This bypasses the broken JS wrapper entirely.

### Steps

1. **Create the module scaffold**
   ```bash
   mkdir -p ios-app/modules/<your-module>/ios
   ```
   Add three files:
   - `expo-module.config.json` — declares the module for autolinking
   - `<your-module>.podspec` — depends on `ExpoModulesCore` + the vendor's CocoaPod
   - `ios/<YourModule>Module.swift` — implements the `Module` protocol

2. **Symlink into node_modules** so autolinking finds it
   ```bash
   ln -s ../../modules/<your-module> ios-app/node_modules/<your-module>
   ```
   Add `"<your-module>": "*"` to `package.json > dependencies`.

3. **Start with a stub** (no vendor SDK import). Verify the module appears in `globalThis.expo.modules` at runtime before adding the real SDK. This isolates registration bugs from SDK bugs early.

4. **Key Swift constraints to know upfront**
   - Objective-C delegate protocols (e.g. `AgoraRtcEngineDelegate`) require `NSObject` inheritance. `Module` does not inherit `NSObject`. → Create a separate `class MyDelegate: NSObject, VendorDelegate` and bridge events back via closures.
   - Share the engine between the `Module` and the `ExpoView` via a file-level `var sharedEngine: VendorEngine?` (both files are in the same Swift module).

5. **Run on a real device** — not Expo Go. `npx expo run:ios -d` builds and installs the actual binary. Expo Go cannot load custom native modules.

6. **After verifying the stub works**, restore the real SDK implementation and `pod install`.

---

## Context

iPhone 17e running iOS 26. The app uses `react-native-agora` for live video streaming. The goal was to get the seller's video stream working on a physical device.

---

## Problem 1 — `react-native-agora` fails to build on iOS 26

### Symptom

Xcode build fails because the `AgoraRtcKit.xcframework` bundled inside `react-native-agora` has a broken `arm64` device slice — compiled against an older iOS SDK, incompatible with iOS 26.

### Solutions tried

| # | Approach | Result |
|---|---|---|
| 1 | Upgrade `react-native-agora` to latest | Still broken — upstream hadn't shipped an iOS 26–compatible XCFramework |
| 2 | Build from source | Not feasible — package doesn't expose a way to substitute a custom framework |
| 3 | Write a custom Expo native module (`agora-viewer`) calling `AgoraRtcEngine_iOS` via Agora's official CocoaPod | **Adopted** ✅ |

---

## Problem 2 — `requireNativeModule('AgoraViewer')` throws at runtime

### Symptom

After creating `modules/agora-viewer/`, the build succeeds and `ExpoModulesProvider.swift` correctly lists `AgoraViewerModule.self`, but `requireNativeModule('AgoraViewer')` throws `Cannot find native module 'AgoraViewer'` at runtime.

### How Expo module registration works

```
requireNativeModule('AgoraViewer')
  → checks globalThis.expo?.modules?.['AgoraViewer']
  ← populated only via EXNativeModulesProxy.setBridge
       → useModulesProvider("ExpoModulesProvider")
       → ExpoModulesProvider.getModuleClasses() → registers all modules
```

`ExpoModulesProvider.swift` is compiled as part of the main `Popup` app target and regenerated on every build by `expo-configure-project.sh`.

### Sub-problem 2a — Duplicate pod declaration in Podfile

**Root cause:** An explicit `pod 'agora-viewer', :path => '../modules/agora-viewer'` line existed alongside `use_expo_modules!`, which already adds the pod via autolinking. The duplicate was silently ignored by CocoaPods.

**Fix:** Remove the explicit `pod 'agora-viewer'` line. `use_expo_modules!` handles it.

### Sub-problem 2b — App was running inside Expo Go, not the custom build

**Root cause:** The app was launched through Expo Go (by scanning a QR code), not through the compiled development binary. Expo Go has a fixed set of native modules compiled into it — custom modules like `agora-viewer` are never present.

**Diagnostic:** Added logging to print `Object.keys(globalThis.expo?.modules)` before the `requireNativeModule` call. The list showed 83 modules including `ExpoGo`, `ExpoCamera`, `ExpoContacts` — packages not in `package.json`. This is Expo Go's built-in registry, not ours.

**Fix:** Run `npx expo run:ios -d` which builds and installs the real binary. Do not use `npx expo start` + Expo Go for any flow that requires custom native modules.

**Resolution:** After switching to the real binary, `AgoraViewer` appeared in the module list (along with only ~18 modules matching our actual dependencies). ✅

---

## Problem 3 — ReactCodegen "Build input file cannot be found" (7 errors)

### Symptom

After deleting DerivedData and running `npx expo run:ios -d`, build fails with errors like:

```
error: Build input file cannot be found:
  '.../ios/build/generated/ios/rnworklets/rnworklets-generated.mm'
  '.../ios/build/generated/ios/rnsvgJSI-generated.cpp'
  ...
```

### Root cause

Xcode's parallel build system schedules `ReactCodegen` compilation before its own codegen script phase finishes writing the files. Race condition — the files do get generated, just too late for the first build pass.

### Fix

Run the build a second time — files exist on disk and are found immediately:
```bash
cd ios-app && npx expo run:ios -d
```

**Avoid deleting DerivedData** unless strictly necessary. It triggers this race condition every time.

---

## Problem 4 — "Developer disk image could not be mounted" on iPhone 17e

### Symptom

```
Error mounting image: 0xe800010f
(kAMDMobileImageMounterPersonalizedBundleMissingVariantError:
The bundle image is missing the requested variant for this device.)
```

### Root cause

Xcode's installed version predated iOS 26 / iPhone 17e. Apple's personalized disk image system (introduced in iOS 17) requires Xcode to have device support files for the exact iOS version + device model. These were missing.

### Fix

Upgrade Xcode to the version that ships with iOS 26 support (Xcode 6.4 in this case):

```bash
sudo xcode-select --switch /Applications/Xcode.app
sudo xcodebuild -license accept
```

Then unplug and replug the device so Xcode mounts the personalized bundle fresh.

---

## Problem 5 — Provisioning profile doesn't include the device

### Symptom

```
Provisioning profile "iOS Team Provisioning Profile: fr.mamath.popup"
doesn't include the currently selected device "Frederic's iPhone"
(identifier 00008150-000C3954228A401C).
```

### Root cause

A new physical device must be registered in the provisioning profile before Xcode can install a development build on it.

### Fix

In Xcode → Popup target → **Signing & Capabilities** tab → enable **"Automatically manage signing"** and set your Team. Xcode will regenerate the profile and register the device automatically.

---

## Problem 6 — Swift: `AgoraRtcEngineDelegate` conformance requires `NSObject`

### Symptom

```
cannot declare conformance to 'NSObjectProtocol' in Swift;
'AgoraViewerModule' should inherit 'NSObject' instead
```

### Root cause

`AgoraRtcEngineDelegate` is an Objective-C protocol that requires `NSObjectProtocol`. `Module` (ExpoModulesCore) does not inherit from `NSObject`, so a class cannot simultaneously be a `Module` subclass and conform to `AgoraRtcEngineDelegate`.

### Fix

Extract the delegate into a separate `NSObject` subclass. Bridge events back to the module via closures:

```swift
class AgoraDelegate: NSObject, AgoraRtcEngineDelegate {
  var onUserJoined: ((UInt, Int) -> Void)?
  var onUserOffline: ((UInt, AgoraUserOfflineReason) -> Void)?

  func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinedOfUid uid: UInt, elapsed: Int) {
    onUserJoined?(uid, elapsed)
  }
  func rtcEngine(_ engine: AgoraRtcEngineKit, didOfflineOfUid uid: UInt, reason: AgoraUserOfflineReason) {
    onUserOffline?(uid, reason)
  }
}

// In AgoraViewerModule.definition():
AsyncFunction("initialize") { (appId: String, promise: Promise) in
  let delegate = AgoraDelegate()
  delegate.onUserJoined = { [weak self] uid, elapsed in
    self?.sendEvent("onUserJoined", ["uid": uid, "elapsed": elapsed])
  }
  // ...
  sharedAgoraDelegate = delegate  // keep alive
  let engine = AgoraRtcEngineKit.sharedEngine(withAppId: appId, delegate: delegate)
  // ...
}
```

This is a general pattern: any Objective-C delegate protocol used inside an Expo module needs this wrapper. ✅

---

## Final file structure

| File | Role |
|---|---|
| `ios-app/modules/agora-viewer/expo-module.config.json` | Autolinking config (`swiftModuleName: "agora_viewer"`) |
| `ios-app/modules/agora-viewer/agora-viewer.podspec` | Pod spec — depends on `ExpoModulesCore` + `AgoraRtcEngine_iOS` |
| `ios-app/modules/agora-viewer/ios/AgoraViewerModule.swift` | Module + `AgoraDelegate` NSObject wrapper |
| `ios-app/modules/agora-viewer/ios/AgoraViewerView.swift` | View — calls `engine.setupRemoteVideo` |
| `ios-app/src/lib/agora.ts` | JS wrapper — `requireNativeModule('AgoraViewer')` |
| `ios-app/ios/Podfile` | `use_expo_modules!` only — no explicit agora pod line |

---

## Key commands

```bash
# Build and install on physical device (the only valid dev workflow for custom native modules)
cd ios-app && npx expo run:ios -d

# After any Podfile or podspec change
cd ios-app/ios && pod install

# If ReactCodegen race condition fires after DerivedData wipe — just rebuild:
cd ios-app && npx expo run:ios -d

# Full clean (use sparingly — triggers ReactCodegen race on next build)
rm -rf ~/Library/Developer/Xcode/DerivedData/Popup-*
cd ios-app && npx expo run:ios -d  # first build will fail; run again
```
