# Mobile App — Developer Guide

> Last updated: 2026-03-03

## TL;DR — Commands Cheat Sheet

| Command | Where | Description |
|---|---|---|
| `npx expo start --dev-client` | `mobile-app/` | Start Metro bundler for dev client (scan QR from phone) |
| `npx expo install <pkg>` | `mobile-app/` | Install a package with the correct version for current SDK |
| `npx expo install --check` | `mobile-app/` | Check all deps match the current Expo SDK |
| `eas build --profile development --platform android` | `mobile-app/` | Build a development APK (cloud, ~10 min) |
| `eas build --profile development --platform ios` | `mobile-app/` | Build a development IPA for simulator |
| `eas build --profile preview --platform android` | `mobile-app/` | Build a standalone preview APK (no Metro needed) |
| `eas build --profile production --platform android` | `mobile-app/` | Build a production AAB for Google Play |
| `eas build:list --limit 5` | `mobile-app/` | List recent builds |
| `eas build:view <build-id>` | `mobile-app/` | View details of a specific build |
| `npx expo config --json` | `mobile-app/` | Validate and display the resolved Expo config |
| `npx expo-doctor` | `mobile-app/` | Run health checks on the project |

---

## Table of Contents

1. [Why React Native?](#1-why-react-native)
2. [Architecture Overview](#2-architecture-overview)
3. [Development Workflow](#3-development-workflow)
4. [When to Rebuild vs. Hot Reload](#4-when-to-rebuild-vs-hot-reload)
5. [EAS Build Service](#5-eas-build-service)
6. [Build Profiles Explained](#6-build-profiles-explained)
7. [Testing on a Physical Device](#7-testing-on-a-physical-device)
8. [Common Issues & Fixes](#8-common-issues--fixes)
9. [Key Configuration Files](#9-key-configuration-files)

---

## 1. Why React Native?

### Benefits

- **Shared codebase** — Write once in TypeScript/React, deploy on iOS and Android. The WhyNot web app already uses React, so components, hooks, types, and business logic patterns transfer directly.
- **TypeScript end-to-end** — The backend (Express/tRPC), web frontend (React/Vite), and mobile app all share one language. tRPC types are shared between server and mobile via `@server/*` path aliases.
- **Hot reload** — Change JS/TS code and see changes instantly on a connected device without rebuilding the entire app. Iteration speed is nearly as fast as web development.
- **Native performance** — Unlike webview-based frameworks, React Native renders actual native UI components. Video streaming (Agora), payments (Stripe), and gestures run at full native speed.
- **Expo ecosystem** — Managed workflow handles native build configuration, OTA updates, push notifications, and more without needing to manually maintain Xcode/Android Studio projects.
- **Large ecosystem** — Access to the full npm registry plus native modules via Expo's autolinking system.

### Tradeoffs

- **Larger app size** — Includes the JavaScript runtime and native bridges (~30-60 MB for a dev build).
- **Native module complexity** — Libraries that rely on native code (Agora, Stripe, Unistyles with Nitro) require a native rebuild when added or updated.
- **Platform differences** — Some UI behaviors differ between iOS and Android; occasional platform-specific code is needed.

---

## 2. Architecture Overview

```
mobile-app/
├── app/                    # File-based routing (Expo Router)
│   ├── (tabs)/             # Tab navigator screens
│   ├── channel/            # Channel screens (viewer, host)
│   ├── shop/               # Shop management screens
│   ├── order/              # Order detail screen
│   └── _layout.tsx         # Root layout (providers, auth)
├── src/
│   ├── components/         # Reusable components
│   ├── hooks/              # Custom hooks (auth, trpc, agora)
│   ├── lib/                # Config, theme, trpc client, utils
│   └── providers/          # React context providers
├── assets/                 # Icons, splash, images
├── app.json                # Expo static config
├── eas.json                # EAS Build profiles
├── .npmrc                  # npm config (legacy-peer-deps=true)
└── package.json
```

**Key tech stack:**
- **Expo SDK 55** + React Native 0.83 + React 19
- **Expo Router** — file-based navigation (like Next.js)
- **react-native-unistyles v3** — styling (powered by Nitro Modules)
- **react-native-agora** — live video/audio streaming
- **@stripe/stripe-react-native** — payments
- **@trpc/react-query** — type-safe API client
- **expo-secure-store** — secure token storage

---

## 3. Development Workflow

### First-time setup

```bash
cd mobile-app
npm install                    # Install dependencies
```

### Daily development

```bash
cd mobile-app
npx expo start --dev-client    # Start Metro bundler
```

This displays a QR code. On your phone, open the **WhyNot** dev client app and scan the QR code. Metro will bundle and serve your JavaScript code to the phone in real-time.

> **Note:** The dev client app must already be installed via an EAS development build (see section 5).

### API configuration

The mobile app reads the API URL from `app.json > extra.apiUrl`:

```json
{
  "extra": {
    "apiUrl": "https://whynot-app.onrender.com"
  }
}
```

This is read by `src/lib/config.ts` via `Constants.expoConfig.extra.apiUrl`. The WebSocket URL is auto-derived by replacing `http` with `ws`.

---

## 4. When to Rebuild vs. Hot Reload

This is the most critical concept to understand. **Not all changes are equal.**

### Changes that DON'T require a rebuild (hot reload)

These changes are picked up instantly by Metro bundler:

| Change type | Example |
|---|---|
| **JS/TS code** | Editing screens, components, hooks, styles |
| **Adding a JS-only npm package** | `superjson`, `date-fns`, `lodash` |
| **Updating `app.json > extra`** | Changing `apiUrl` (restart Metro) |
| **Modifying assets** | Images, fonts (restart Metro) |

> After installing a JS-only package: just restart Metro (`Ctrl+C` then `npx expo start --dev-client`).

### Changes that REQUIRE a new EAS build

These changes affect the native binary and won't be picked up by Metro:

| Change type | Example | Why |
|---|---|---|
| **Adding/removing a native module** | `react-native-agora`, `@stripe/stripe-react-native` | Native code must be compiled into the binary |
| **Upgrading a native module** | `react-native-unistyles` v3→v4 | Different native code in new version |
| **Changing `app.json > plugins`** | Adding `expo-camera` plugin | Plugins modify native project files |
| **Changing `app.json > android/ios`** | Permissions, package name, icons | These are build-time settings |
| **Upgrading Expo SDK** | SDK 55 → 56 | New React Native version, new native deps |
| **Changing `eas.json` build config** | Build profiles, env vars | Build-time only |

### Decision rule

> **"Does the change involve native code (Kotlin/Swift/C++) being added, removed, or modified?"**
> - **Yes** → Rebuild with `eas build`
> - **No** → Just restart Metro

---

## 5. EAS Build Service

**EAS (Expo Application Services)** is Expo's cloud build platform. It compiles the native Android and iOS projects on remote servers so you don't need Android Studio or Xcode locally.

### What EAS does

1. **Uploads your project** to Expo's cloud servers
2. **Runs `expo prebuild`** — Generates native `android/` and `ios/` directories from your Expo config
3. **Runs Gradle (Android) or Xcode (iOS)** — Compiles native code
4. **Signs the build** — Uses stored credentials (keystore for Android, certificates for iOS)
5. **Returns an artifact** — APK/AAB (Android) or IPA (iOS) available for download

### Free tier limits

- **30 builds per month** (rolling)
- Builds are queued in a "Free tier queue" (typically 1-5 min wait)
- Build time: ~8-12 min for Android, ~15-20 min for iOS

### EAS project info

| Property | Value |
|---|---|
| Project name | `@frederic-mamath/whynot` |
| Project ID | `50620817-a61d-4545-8091-6566e41f711f` |
| Dashboard | https://expo.dev/accounts/frederic-mamath/projects/whynot |

---

## 6. Build Profiles Explained

Defined in `eas.json`:

### `development` — For daily development

```bash
eas build --profile development --platform android
```

- Produces an **APK** (not AAB) for direct install
- Includes the **dev client** (Metro bundler connection UI)
- Allows connecting to Metro for hot reload
- Signed with a debug keystore
- **Use this** for development on physical devices

### `preview` — For testing/QA

```bash
eas build --profile preview --platform android
```

- Produces a **standalone APK** that doesn't need Metro
- Bundles the JS code directly inside the app
- Good for sharing with testers or stakeholders
- **Use this** for testing without a dev machine running

### `production` — For store release

```bash
eas build --profile production --platform android
```

- Produces a signed **AAB** (Android App Bundle) for Google Play
- Optimized, minified, no dev tools
- Auto-increments version code
- **Use this** for store submissions

---

## 7. Testing on a Physical Device

### Prerequisites

1. A **development build** APK installed on the device (from EAS)
2. **Mac and phone on the same WiFi network**
3. Metro bundler running on the Mac

### Step-by-step

1. **Build the dev client** (only needed once, or when native deps change):
   ```bash
   cd mobile-app
   eas build --profile development --platform android
   ```

2. **Download and install the APK** on your phone:
   - Open the build URL in your phone's browser
   - Install the APK (enable "Install from unknown sources" if prompted)

3. **Start Metro bundler** on your Mac:
   ```bash
   cd mobile-app
   npx expo start --dev-client
   ```

4. **Open WhyNot** on your phone → scan the QR code or enter the Metro URL manually

5. **Develop!** — Code changes appear in real-time on the phone

### Troubleshooting connection

- If the phone can't connect, verify both devices are on the same WiFi
- Try using the tunnel option: `npx expo start --dev-client --tunnel`
- Check that your Mac's firewall allows port 8081

---

## 8. Common Issues & Fixes

### "Unable to resolve X" at bundle time

**Cause:** A JS dependency is missing.
**Fix:** Install it — `npx expo install <package-name>` — then restart Metro.
**No rebuild needed** if it's a JS-only package.

*Example:* `react-dom` was missing → `npx expo install react-dom` fixed it without rebuilding.

### Gradle build fails: "Project with path ':X' could not be found"

**Cause:** A native module's peer dependency isn't listed as a direct dependency in `package.json`. Expo's autolinking only picks up top-level dependencies.
**Fix:** Add the missing native module as a direct dependency.

*Example:* `react-native-unistyles` v3 depends on `react-native-nitro-modules`, which must be in `package.json` → `npx expo install react-native-nitro-modules`.

### expo doctor reports version mismatches

**Cause:** A package version doesn't match the current Expo SDK's expectations.
**Fix:** `npx expo install <package-name>` will auto-resolve to the correct version.

*Example:* `@react-native-community/netinfo` v12 → downgraded to v11.5.2 for SDK 55.

### "Invalid config plugin" during build

**Cause:** A package is listed in `app.json > plugins` but isn't actually a config plugin (it's a runtime-only library).
**Fix:** Remove it from the `plugins` array. Only list packages that provide an Expo config plugin.

*Example:* `react-native-unistyles` was in plugins but it's runtime-only → removed.

### npm install fails on EAS with peer dep errors

**Cause:** React 19 peer dependency conflicts with packages expecting React 18.
**Fix:** Create `.npmrc` with `legacy-peer-deps=true` in the `mobile-app/` directory.

---

## 9. Key Configuration Files

### `app.json`

Central Expo configuration. Defines:
- App name, slug, version, icons, splash screen
- iOS/Android-specific settings (permissions, bundle ID, package name)
- **Plugins** — native config plugins that modify the native project at build time
- **Extra** — runtime values accessible via `Constants.expoConfig.extra` (API URL, Stripe key, etc.)

### `eas.json`

EAS Build configuration. Defines build profiles (development, preview, production) with settings for distribution, signing, and auto-versioning.

### `.npmrc`

```
legacy-peer-deps=true
```

Required for EAS cloud builds to work with React 19 (many packages still declare React 18 as peer dependency).

### `package.json`

Dependencies list. **Important:** All native modules must be listed here as direct dependencies for Expo autolinking to work. Transitive native dependencies won't be autolinked.

### `tsconfig.json`

TypeScript config. Extends `expo/tsconfig.base`. Defines path aliases:
- `@/*` → `./src/*` (app code)
- `@server/*` → `../app/src/*` (shared server types — unused in current config)
