# React Native iOS Deployment

## Code Layers: From TypeScript to the Device

A React Native / Expo app passes through several transformation layers before any code runs on a physical iPhone. Understanding each layer explains why some changes require a full App Store submission while others can be pushed in seconds.

**Layer 1 — TypeScript source** is what you write: screens, components, hooks, tRPC calls. This is the only layer you directly author. It is platform-agnostic and has no knowledge of iOS internals.

**Layer 2 — Metro Bundler** is Expo's build tool. It transpiles TypeScript to plain JavaScript, resolves all `import` statements into a single dependency graph, tree-shakes unused code, and emits one file: `main.jsbundle`. Metro runs during `npx expo export` (for production) or as a local dev server during `npx expo start`. Every asset referenced in the JS (images, fonts) is also collected and hashed at this stage.

**Layer 3 — Hermes engine** is a JavaScript runtime compiled into the native binary itself. It is not Node.js and not a browser. Hermes pre-compiles the JS bundle into bytecode at build time, which is why Expo apps start faster than older React Native setups. At runtime, Hermes executes the bytecode on its own thread inside the native process. Crucially, Hermes does not support `eval()` of downloaded strings — you cannot fetch arbitrary JS and run it. This is relevant to how OTA updates work (see below).

**Layer 4 — JSI (JavaScript Interface)** is a thin C++ bridge between the Hermes thread and the native thread. In the New Architecture (enabled in this project via `newArchEnabled: true`), JS can call native functions synchronously through JSI with no serialization overhead. This is what makes real-time features like Agora video viable — the old bridge used asynchronous JSON message passing, which introduced latency. JSI exposes native modules (camera, payments, Agora) as objects directly accessible from JS.

**Layer 5 — Native modules** are Swift or Objective-C implementations of device capabilities. Some are bundled with Expo SDK (expo-secure-store, expo-router). Others come from third-party packages (stripe-react-native). Custom ones are written by hand (agora-viewer in this project). They are compiled to machine code by Xcode and embedded in the native binary. This is the layer that Apple actually reviews.

```
Your TypeScript
      │
      ▼
Metro Bundler  →  main.jsbundle
                       │
                       ▼
              Hermes engine (inside the binary)
                       │  JSI (C++ bridge)
                       ▼
              Native Modules (Swift/ObjC compiled code)
                       │
                       ▼
              iOS APIs (UIKit, AVFoundation, CoreBluetooth, ...)
```

---

## When a New App Store Review Is Required

Apple reviews the **native binary** — the compiled Swift/ObjC/C++ artifact produced by Xcode. A new binary is required, and therefore a new App Store review (typically 1–3 days), whenever you change anything that affects the native layer:

- Adding or removing a native module (any npm package that ships an `app.plugin.js` or native `.podspec`)
- Changing permissions declared in `Info.plist` (camera, microphone, location, etc.)
- Changing the Stripe plugin `merchantIdentifier` or other entitlements (baked into the `.entitlements` file at prebuild time)
- Updating the Expo SDK to a new major version
- Bumping the app version in `app.config.ts` (required by App Store policy for each submission)
- Changing the app icon or splash screen

Anything that lives entirely in the JS layer — new screens, new components, tRPC query changes, UI redesigns, bug fixes in TypeScript — does **not** require a new binary and can be shipped via OTA update (see below).

The practical rule: if `npx expo prebuild --clean` would produce a different `ios/` folder, you need a new binary.

---

## What EAS Is

EAS (Expo Application Services) is Expo's hosted cloud platform for three distinct services: Build, Submit, and Update.

**EAS Build** compiles your app in the cloud on Expo's macOS machines, so you do not need a Mac or an Apple Developer account locally. It produces a signed `.ipa` ready for the App Store. This project does not use EAS Build — binaries are built locally via Xcode Archive.

**EAS Submit** automates uploading a binary to App Store Connect using the App Store Connect API. This project also does not use EAS Submit — uploads are done manually via Xcode Organizer.

**EAS Update** is the service this project uses. It hosts over-the-air JS bundles and serves them to devices via a signed CDN. When you run `eas update --channel production`, it bundles your JS with Metro, signs the output cryptographically, and uploads it to Expo's CDN. Devices running a compatible binary check this CDN on launch and download the new bundle if one is available.

EAS Update could in principle be self-hosted — the protocol is open. What EAS provides on top of self-hosting is bundle signing (preventing man-in-the-middle injection of malicious JS), a dashboard for tracking which users are on which update, and one-command rollback. The free tier is sufficient for early-stage apps.

---

## What OTA Updates Are

OTA (Over-The-Air) updates are a mechanism for replacing the JS bundle on a user's device without going through the App Store. They are possible because a React Native app is composed of two independent artifacts:

1. **The native shell** — compiled Swift/ObjC/C++ code, reviewed and signed by Apple, stored in the `.ipa`. This never changes between OTA updates.
2. **The JS bundle** — the output of Metro Bundler, containing all product logic. This can be replaced after installation.

Apple permits this under guideline 2.5.2, which carves out an exception for "scripts run by JavaScriptCore or WebKit, provided such scripts do not change the primary purpose of the application." React Native uses Hermes (a JavaScriptCore derivative), so the exception applies. This pattern has been used in production by React Native apps since 2015 without App Store rejections, as long as the JS changes remain consistent with the app's approved purpose.

The practical consequence: any change that lives entirely in TypeScript can be shipped in minutes rather than days.

```
JS-only change:   code → eas update → CDN → user device on next launch  (minutes)
Native change:    code → Xcode archive → App Store review → user device  (1–3 days)
```

---

## What expo-updates Does

`expo-updates` is a native Expo module that intercepts the app startup sequence and decides which JS bundle Hermes should load. Without it, Hermes always loads the bundle embedded in the binary at build time. With it, a bundle downloaded from the CDN can be loaded instead.

The startup sequence with `expo-updates` installed:

1. The iOS process starts and native Swift code initializes.
2. Before Hermes starts, the `expo-updates` native module runs.
3. It checks device local storage: has a newer bundle been previously downloaded?
   - If yes: point Hermes at the downloaded bundle file on disk.
   - If no: point Hermes at the embedded `main.jsbundle`.
4. Hermes starts and executes whichever bundle won.
5. In the background (after the app is running), `expo-updates` makes an HTTP request to the `updates.url` configured in `Info.plist`.
6. If a newer bundle is available for this device's channel and runtime version, it is downloaded silently to local storage.
7. On the **next** app launch, that downloaded bundle becomes the active one.

This two-launch pattern (download on launch N, apply on launch N+1) is the default. It ensures the update is fully downloaded before it runs, avoiding a partial-load crash. A blocking mode is available (`fallbackToCacheTimeout: 0`) that delays the splash screen until a fresh update is confirmed, but it adds startup latency.

**Runtime version matching** is the safety mechanism. Every binary is stamped with a runtime version (equal to the app version when using the `appVersion` policy). Every published update is also stamped with a runtime version. `expo-updates` only applies an update if the stamps match exactly. This prevents a bundle built for version 1.0.3 — which might reference a native module added in that version — from being loaded by a device still running the 1.0.2 binary that lacks that module.

```
Binary (stamped at Xcode build time)     Update (stamped at eas update time)
────────────────────────────────────     ────────────────────────────────────
channel: "production"              ←──── channel: "production"       ✓ match
runtimeVersion: "1.0.2"           ←──── runtimeVersion: "1.0.2"    ✓ match

→ update is applied

runtimeVersion: "1.0.2"           ←──── runtimeVersion: "1.0.3"    ✗ mismatch
→ update is ignored
```

`expo-updates` does not use `eval()`. It works at the file system level: it writes the new bundle to a path on disk, and on the next launch, the native startup code provides that path to Hermes instead of the embedded one. This is consistent with Apple's guidelines, which prohibit runtime code evaluation but not loading a different file.
