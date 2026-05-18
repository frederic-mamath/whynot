# ticket-004 — Push first OTA update and verify it lands on device

## Acceptance Criteria

- As a developer, I can push a JS change to the production channel with `eas update`
- As a developer, the change appears on a physical device running 1.0.3 without installing a new binary

## Technical Strategy

- iOS App (`ios-app/`)
  - View
    - Any screen (e.g. `ios-app/app/(tabs)/lives.tsx`)
      - Make a small, visible text change to confirm the OTA update is working. Revert after verification.

## Manual Operations

### Before you start

Make sure:
- Ticket-003 is done and the 1.0.3 binary is **approved and live on the App Store** (not just uploaded — it must be the public production version)
- Your physical iPhone has updated to 1.0.3 from the App Store
- You are logged in to EAS CLI (`eas whoami`)

---

### Step 1 — Make a visible JS change

Open `ios-app/app/(tabs)/lives.tsx`. On line 41, change the page title temporarily:

```typescript
// Before
<Text style={styles.pageTitle}>Lives</Text>

// After (temporary — for verification only)
<Text style={styles.pageTitle}>Lives ✓</Text>
```

This is a JS-only change — no native module touched, no `app.config.ts` changed.

---

### Step 2 — Publish the OTA update

From `ios-app/`:

```bash
eas update --channel production --message "test: verify OTA pipeline"
```

EAS will:
1. Bundle the JS code
2. Upload the bundle to Expo's CDN
3. Print a confirmation with an update ID and a URL to view it in the EAS dashboard

The command takes ~1 minute. When it finishes, the update is live.

---

### Step 3 — Receive the update on device

OTA updates are fetched in the background when the app launches. To trigger it immediately:

1. On your iPhone, **close the Popup app completely** (swipe up from app switcher)
2. Open the app → wait ~5 seconds on the home screen
3. **Close the app again** and reopen it

On the second open, the downloaded update is applied. You should see **"Lives ✓"** in the title — without having installed anything from the App Store.

**Why two opens?** `expo-updates` downloads the update on the first launch, then applies it on the next launch. This is the default behavior (`UpdatesConfig.checkOnLaunch = "ALWAYS"`).

---

### Step 4 — Revert the test change

Once verified, revert line 41:

```typescript
<Text style={styles.pageTitle}>Lives</Text>
```

Publish the revert:

```bash
eas update --channel production --message "revert: remove OTA test label"
```

---

### Step 5 — Verify in the EAS dashboard

1. Go to **https://expo.dev** → your account → project **popup-ios** → **Updates**
2. You should see both updates listed with their timestamps, message, and runtime version (1.0.3)

---

### Day-to-day workflow going forward

For any JS-only change (new screen, bug fix, UI tweak):

```bash
# 1. Make your code changes
# 2. Verify TypeScript
npx tsc --noEmit

# 3. Push to production
eas update --channel production --message "fix: <description of change>"
```

That's it. Users get the update silently on their next app launch.

For native changes (new Expo plugin, new permission, new native module): follow the Xcode Archive → App Store Connect flow (same as ticket-003), bump the version number each time.
