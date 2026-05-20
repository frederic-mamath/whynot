# ticket-002 — Mobile: install + configure native OAuth packages

## Acceptance Criteria

- As a developer, `expo-apple-authentication` and `@react-native-google-signin/google-signin` are installed at SDK-compatible versions and listed in `ios-app/package.json`
- As a developer, `ios-app/app.config.ts` declares:
  - `expo-apple-authentication` in the plugins array (and only on iOS — the package is iOS-only)
  - `@react-native-google-signin/google-signin` in the plugins array with the `iosUrlScheme` set to the reversed iOS client ID
  - `ios.usesAppleSignIn: true` (writes the `com.apple.developer.applesignin` entitlement at prebuild time)
- As a developer, `ios-app/app.config.ts > extra` exposes the three Google OAuth client IDs as `EXPO_PUBLIC_*` vars so the mobile JS layer can pass `webClientId` to the Google SDK
- As a developer, `npx expo prebuild --clean` completes without errors; iOS pods install; Android Gradle config is generated
- As a developer, the Google Cloud Console contains three OAuth 2.0 Client IDs (iOS / Android / Web) and the values are recorded in `.env` (mobile) and the backend env (matching ticket-001)
- As a developer, the Apple Developer Portal has "Sign In with Apple" enabled for the `fr.mamath.popup` App ID

## Technical Strategy

- iOS App (`ios-app/`)
  - Packages
    - `ios-app/package.json`
      - `npx expo install expo-apple-authentication`
      - `npx expo install @react-native-google-signin/google-signin`
      - Both have an `app.plugin.js` — verify with `ls node_modules/<pkg>/app.plugin.js` before adding to plugins (per `ios-app/CLAUDE.md` conventions)
  - Configuration
    - `ios-app/app.config.ts`
      - In `ios` block: add `usesAppleSignIn: true`
      - In `plugins` array, add:
        - `"expo-apple-authentication"` (string entry — no options needed)
        - `["@react-native-google-signin/google-signin", { iosUrlScheme: "com.googleusercontent.apps.<GOOGLE_IOS_CLIENT_ID_PREFIX>" }]` — the value is the reversed iOS client ID. The exact format is provided by Google Cloud Console at iOS client creation time.
      - In `extra` block, add three entries (read from `.env`):
        - `googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ""`
        - `googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? ""`
        - `googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ""`
  - Native regeneration
    - `npx expo prebuild --clean` — verify the iOS entitlements file contains `com.apple.developer.applesignin` and the Google `URLTypes` is in `Info.plist`

## Manual operations to configure services

### Step 1 — Apple Developer Portal

1. Go to **https://developer.apple.com/account → Certificates, Identifiers & Profiles → Identifiers → App IDs**
2. Click on `fr.mamath.popup`
3. Scroll to **Capabilities** → check **Sign In with Apple** → **Save**
4. Confirm by clicking **Continue → Save** on the "Modify App ID" dialog

That's it on Apple's side. Apple doesn't require a separate "client ID" for mobile — the bundle ID is the audience.

### Step 2 — Google Cloud Console

Go to **https://console.cloud.google.com/apis/credentials** (use the Google account that owns the Popup OAuth project — same one used for the web sign-in if you set it up before).

**Create three OAuth 2.0 Client IDs:**

#### 2a — iOS Client ID
1. **+ CREATE CREDENTIALS → OAuth client ID**
2. Application type: **iOS**
3. Name: `Popup iOS`
4. Bundle ID: `fr.mamath.popup`
5. **CREATE** → copy the client ID

The "reversed client ID" appears in the modal too — it looks like `com.googleusercontent.apps.123456789-abc...`. Save both values.

#### 2b — Android Client ID
1. **+ CREATE CREDENTIALS → OAuth client ID**
2. Application type: **Android**
3. Name: `Popup Android`
4. Package name: `fr.mamath.popup`
5. SHA-1 certificate fingerprint: get it from the release keystore (when it exists from feature 062 ticket-006) or from the debug keystore for testing. For the debug keystore:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey \
     -storepass android -keypass android | grep SHA1
   ```
6. **CREATE** → copy the client ID

For production, you'll need to add a second SHA-1 derived from the release keystore once it's generated in feature 062.

#### 2c — Web Client ID (used as `serverClientId` on mobile)
1. **+ CREATE CREDENTIALS → OAuth client ID**
2. Application type: **Web application**
3. Name: `Popup Web (server)`
4. No redirect URIs needed for this one — it's only used as the audience for the ID token that the mobile SDK sends to the backend
5. **CREATE** → copy the client ID

### Step 3 — Record the env vars

Add to `ios-app/.env` (mobile):

```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<from step 2a>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<from step 2b>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<from step 2c>
```

Add to `app/.env` (backend) — already required by ticket-001:

```bash
GOOGLE_IOS_CLIENT_ID=<same as above>
GOOGLE_ANDROID_CLIENT_ID=<same as above>
GOOGLE_WEB_CLIENT_ID=<same as above>
APPLE_BUNDLE_ID=fr.mamath.popup
```

On Render (staging + production), add the same four backend env vars in the service settings.

### Step 4 — Update the plugin config

After step 2a, update `ios-app/app.config.ts > plugins`:

```typescript
[
  "@react-native-google-signin/google-signin",
  { iosUrlScheme: "com.googleusercontent.apps.<your-reversed-ios-client-id>" }
]
```

The `iosUrlScheme` is what gets written to `Info.plist > CFBundleURLTypes` at prebuild time — it lets Google's iOS SDK receive the OAuth callback. Without it, the iOS Google sign-in flow crashes.

### Step 5 — Verify

```bash
cd ios-app
npx expo prebuild --clean
npx tsc --noEmit
```

After prebuild, inspect the generated entitlements:

```bash
grep -A1 "applesignin" ios/popup-ios/popup-ios.entitlements
grep -A2 "CFBundleURLSchemes" ios/popup-ios/Info.plist | head -5
```

Both should show the expected values (Sign In with Apple entitlement + the reversed Google iOS client ID URL scheme).
