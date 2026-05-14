# ticket-003 — Build and submit 1.0.2 binary with expo-updates baked in

## Acceptance Criteria

- As a developer, a 1.0.2 binary containing the `expo-updates` native module is uploaded to App Store Connect
- As a developer, the 1.0.2 build is attached to a new version in App Store Connect and submitted for review

## Technical Strategy

- iOS App (`ios-app/`)
  - Configuration
    - `ios-app/app.config.ts`
      - Bump `version` from `1.0.1` to `1.0.2`

The binary is built locally via Xcode (same workflow as 1.0.1), not via EAS Build.

## Manual Operations

### Step 1 — Bump the version

In `ios-app/app.config.ts`, change:

```typescript
version: "1.0.1",
```

to:

```typescript
version: "1.0.2",
```

---

### Step 2 — Prebuild (mandatory — native module changed)

`expo-updates` is a native module. The iOS project must be regenerated:

```bash
cd /Users/fredericmamath/freelance/whynot/ios-app
npx expo prebuild --clean
```

This regenerates `ios/` with the updated `expo-updates` native code. Wait for it to complete fully.

---

### Step 3 — Open Xcode and archive

```bash
open ios/popup-ios.xcworkspace
```

In Xcode:

1. At the top, select the target scheme **popup-ios** (not a simulator — select **"Any iOS Device (arm64)"** from the device dropdown)
2. Menu → **Product → Archive**
3. Wait for the archive to complete (several minutes). The Organizer window opens automatically.

---

### Step 4 — Distribute via App Store Connect

In the Xcode Organizer:

1. Select the new archive (check the version shows **1.0.2**)
2. Click **Distribute App**
3. Select **App Store Connect** → **Next**
4. Select **Upload** → **Next**
5. Leave all options at their defaults → **Next** → **Next**
6. Click **Upload**
7. Wait for the upload to complete. Xcode shows a success banner.

---

### Step 5 — Create version 1.0.2 in App Store Connect

1. Go to **https://appstoreconnect.apple.com** → **Popup** → **Distribution**
2. On the left sidebar, under **iOS App**, click the **+** next to the version list
3. Enter version **1.0.2** → **Create**
4. Wait 15–30 minutes for the 1.0.2 build to finish processing by Apple
5. In the version page, under **Build**, click **+** → select the 1.0.2 build
6. In **What's new**: write a brief note (e.g. *"Améliorations de stabilité"*) — required even for internal changes
7. Review Notes: copy the same review notes from 1.0.1 (demo videos + demo account)
8. Click **Ajouter à la révision** → **Soumettre à la révision Apple**

---

### Wait condition

Apple will review 1.0.2 (typically 1–3 days). Once approved and live, every future JS-only change deploys via `eas update` — no new binary needed until you add native code.
