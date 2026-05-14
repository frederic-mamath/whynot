# ticket-002 — Install expo-updates and configure app.config.ts + eas.json

## Acceptance Criteria

- As a developer, `expo-updates` is installed and `npx tsc --noEmit` passes with zero errors
- As a developer, `app.config.ts` declares the EAS update URL and runtime version policy
- As a developer, `eas.json` exists and defines a `production` build profile with a `production` channel

## Technical Strategy

- iOS App (`ios-app/`)
  - Package
    - `ios-app/package.json`
      - Add `expo-updates` via `npx expo install`
  - Configuration
    - `ios-app/app.config.ts`
      - Add `updates.url` pointing to the EAS update endpoint
      - Add `runtimeVersion` with `appVersion` policy
      - Ensure `extra.eas.projectId` is present (added in ticket-001)
  - EAS Config
    - `ios-app/eas.json` *(create)*
      - Define `production` build profile with `channel: "production"`

## Manual Operations

### Step 1 — Install expo-updates

From `ios-app/`:

```bash
npx expo install expo-updates
```

This installs the correct version of `expo-updates` that matches your current Expo SDK. Do **not** use `npm install expo-updates` directly — the version must match the SDK.

---

### Step 2 — Update app.config.ts

Open `ios-app/app.config.ts`. Add two new top-level fields inside the config object, **before** the `ios` block:

```typescript
updates: {
  url: "https://u.expo.dev/YOUR_PROJECT_ID",
},
runtimeVersion: {
  policy: "appVersion",
},
```

Replace `YOUR_PROJECT_ID` with the UUID from ticket-001 (same value as `extra.eas.projectId`).

The full `app.config.ts` should look like this after the change:

```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Popup",
  slug: "popup-ios",
  version: "1.0.1",
  // ...
  updates: {
    url: "https://u.expo.dev/YOUR_PROJECT_ID",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  ios: {
    // ... unchanged
  },
  // ...
  extra: {
    eas: {
      projectId: "YOUR_PROJECT_ID",
    },
    // ... rest of extra unchanged
  },
});
```

**Why `appVersion` policy?** This ties OTA updates to the app version number. Users on version 1.0.2 only receive updates published for 1.0.2. When you ship 1.0.3 (a new binary), it gets its own independent OTA stream. This prevents sending a JS bundle built for 1.0.3 to a user still on 1.0.2 who might be missing a native module.

---

### Step 3 — Create eas.json

Create `ios-app/eas.json` with this content:

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "production": {
      "channel": "production"
    }
  }
}
```

**What this does**: when you build a binary, the `production` profile stamps the binary with the `production` channel. OTA updates published to the `production` channel will be delivered to that binary.

---

### Step 4 — Verify

Run from `ios-app/`:

```bash
npx tsc --noEmit
```

Must complete with zero errors. Do not proceed to ticket-003 if errors are present.
