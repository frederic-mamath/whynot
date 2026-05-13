# ticket-002 — Build and upload 1.0.1 binary with account deletion

## Acceptance Criteria

- As a submitter, a signed 1.0.1 binary including the account deletion feature (feature 058) is uploaded to App Store Connect and appears in TestFlight within 15 minutes of upload

## Context

Version 1.0.1 is already set in `ios-app/app.config.ts`. The account deletion code is in the codebase (feature 058 tickets 001–006). This ticket is purely the build and upload pipeline from feature 057 ticket-002, applied to the new version.

## Manual Operations

### Step 1 — Create `ios-app/.env.production` if not already present

```bash
# ios-app/.env.production
EXPO_PUBLIC_API_URL=https://popup-live.fr
EXPO_PUBLIC_WS_URL=wss://popup-live.fr
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID=merchant.fr.mamath.popup
```

Get the live Stripe key at [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) → toggle to **Live mode** → copy Publishable key.

### Step 2 — Swap environment and prebuild

```bash
cd ios-app
cp .env .env.dev.backup
cp .env.production .env
npx expo prebuild --clean
```

### Step 3 — Archive in Xcode

Xcode will open automatically after prebuild (or open `ios/Popup.xcworkspace` manually).

1. Set destination to **Any iOS Device (arm64)** in the top toolbar
2. **Product → Archive** — takes 3–5 minutes
3. When the Organizer opens, verify the build shows version **1.0.1**

### Step 4 — Upload via Organizer

1. Select the archive → **Distribute App**
2. **App Store Connect** → **Upload** → leave all options checked → **Upload**
3. Upload takes 2–5 minutes — wait for "Upload Successful"
4. The build appears in App Store Connect → **TestFlight** within ~15 minutes after Apple processes it

### Step 5 — Restore local environment

```bash
cd ios-app
cp .env.dev.backup .env
rm .env.dev.backup
```

Verify local dev still connects to your local server:
```bash
npx expo run:ios
```
