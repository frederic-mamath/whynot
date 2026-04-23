# ticket-002 — Production Build Configuration & Xcode Archive

## Acceptance Criteria

- As a developer, running `npx expo prebuild --clean` produces a native iOS project configured for production (Release scheme, correct bundle ID)
- As a developer, the production build connects to `https://popup-live.fr` and uses Stripe live mode keys
- As a developer, local development is unaffected — `ios-app/.env` still points to local/device IP after the build
- As a submitter, a signed `.ipa` is uploaded to App Store Connect via Transporter (free Apple tool)

## Technical Strategy

### How production environment variables work

Expo reads `EXPO_PUBLIC_*` variables from `ios-app/.env` at **bundle time** — when Metro builds the JavaScript. The values are baked into the JS bundle. This means you must set production values in `.env` **before** running prebuild, then restore dev values after.

The strategy: keep `ios-app/.env` for local dev, and `ios-app/.env.production` (gitignored) for production values. Swap before building, swap back after.

---

### Step 1 — Create `ios-app/.env.production`

Create the file `ios-app/.env.production` with your production values:

```bash
# ios-app/.env.production
EXPO_PUBLIC_API_URL=https://popup-live.fr
EXPO_PUBLIC_WS_URL=wss://popup-live.fr
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID=merchant.fr.mamath.popup
```

**Where to get the Stripe live key:**
1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Toggle to **Live mode** (top-left switch)
3. Copy the **Publishable key** (starts with `pk_live_`)

**Make sure `.env.production` is gitignored.** Open `ios-app/.gitignore` and confirm `.env*` or `.env.production` is listed. If not, add it:
```bash
echo ".env.production" >> ios-app/.gitignore
```

---

### Step 2 — Add a build script to `ios-app/package.json`

Open `ios-app/package.json` and add to the `"scripts"` section:

```json
"build:ios:prod": "cp .env .env.dev.backup && cp .env.production .env && npx expo prebuild --clean && open ios/Popup.xcworkspace && echo 'Archive in Xcode, then restore env with: cp .env.dev.backup .env'"
```

This script:
1. Backs up your current `.env` to `.env.dev.backup`
2. Copies `.env.production` to `.env`
3. Runs `expo prebuild --clean` (generates native iOS project with production values baked in)
4. Opens the Xcode workspace for you
5. Reminds you to restore `.env` after archiving

Run it with:
```bash
cd ios-app
npm run build:ios:prod
```

---

### Step 3 — Archive in Xcode

Once Xcode opens with `ios/Popup.xcworkspace`:

1. In the top toolbar, set the destination to **Any iOS Device (arm64)**
   - Click the device selector (next to the play button)
   - Select "Any iOS Device (arm64)" — not a simulator, not your physical device

2. In the menu bar: **Product → Archive**
   - This triggers a Release build and packages it as an `.xcarchive`
   - Takes ~3–5 minutes
   - If Xcode asks about signing: select **Automatically manage signing** and choose your Apple Developer team

3. When archiving completes, the **Organizer** window opens automatically
   - If it doesn't: **Window → Organizer**

---

### Step 4 — Upload to App Store Connect via Organizer

In the Organizer window:

1. Select your archive (shows today's date and version 1.0)
2. Click **Distribute App**
3. Select **App Store Connect** → **Next**
4. Select **Upload** → **Next**
5. Leave all options checked (include bitcode, symbols) → **Next**
6. Xcode handles signing automatically → **Next**
7. Click **Upload**

Upload takes 2–5 minutes. You'll see a spinner, then "Upload Successful".

The build will appear in App Store Connect under **TestFlight** within ~15 minutes after processing.

---

### Step 5 — Restore your local `.env`

After the upload completes, restore your dev environment:

```bash
cd ios-app
cp .env.dev.backup .env
rm .env.dev.backup
```

Verify local dev still works:
```bash
npx expo run:ios
# Should connect to your local IP, not popup-live.fr
```

---

### Step 6 — Install Transporter (alternative upload method)

If Xcode's built-in upload fails (network issue, certificate problem), use **Transporter** as a fallback:

1. Download free from Mac App Store: search "Transporter" (by Apple)
2. Sign in with your Apple Developer account
3. Drag the `.xcarchive` file (found at `~/Library/Developer/Xcode/Archives/`) into Transporter
4. Click **Deliver**

---

### Files modified by this ticket

| File | Change |
|:-----|:-------|
| `ios-app/.env.production` | Created (gitignored) — production env vars |
| `ios-app/.gitignore` | `.env.production` added if not already ignored |
| `ios-app/package.json` | `build:ios:prod` script added |

### Files NOT modified

`ios-app/.env` — untouched. Local development continues to work without any changes.

## Manual Operations

- **Stripe live publishable key**: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → toggle to **Live mode** → copy Publishable key
- **Apple Developer Team ID** (needed if Xcode asks during signing): [developer.apple.com/account](https://developer.apple.com/account) → Membership Details → Team ID
