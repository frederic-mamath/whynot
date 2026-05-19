# ticket-006 — Build + submit Android AAB to Play Store internal testing

## Goal

Sign and build the first Android binary, upload it to Google Play Console under the **internal testing** track, install it on the S23+ from the Play Store test link, verify all flows work end-to-end, then promote to production review.

## Acceptance Criteria

- As a developer, a release keystore is generated and stored securely (this keystore must never be lost — re-signing is impossible)
- As a developer, the Android version is set in `app.config.ts` (`android.versionCode: 1`, `android.versionName: "1.0.0"`)
- As a developer, `cd android && ./gradlew bundleRelease` produces a signed `.aab` file under `android/app/build/outputs/bundle/release/`
- As a developer, the `.aab` is uploaded to Google Play Console → **Internal testing** track
- As a developer, the buyer account (`fredericmamath@gmail.com`) is added as an internal tester
- As a developer, the build is uploaded to the Play Console **Internal testing** track and the test link is generated successfully
- As a buyer on Android (emulator with Play Store, or S23+ when available), I can sideload the AAB via `adb install` and verify: log in, browse Lives tab, watch a live (video renders via Kotlin module from tickets 002–003), add a card via Google Pay (from ticket-004), and place a fixed-price purchase
- As a developer, **the "install from Play Store internal test link on a real device" final check is deferred** until a physical Android device is available. Build, upload, and sideload verification are sufficient to complete the ticket; the Play Store install path will be revalidated when hardware is back.
- As a developer, the build is promoted from internal testing to **Production review** (Google Play review typically completes in hours to ~3 days)

## Technical Strategy

- iOS App (`ios-app/`)
  - Configuration
    - `app.config.ts`
      - Add Android version fields under the `android` block:

        ```typescript
        android: {
          package: "fr.mamath.popup",
          versionCode: 1,
          versionName: "1.0.0",
        },
        ```

      - **Note**: Android versioning is independent of iOS. iOS is on 1.0.2 (in review) but Android starts fresh at 1.0.0.

## Manual operations

### 1. Generate the release keystore (DO ONCE — KEEP FOREVER)

From `ios-app/`:

```bash
keytool -genkey -v \
  -keystore popup-release.keystore \
  -alias popup \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- Keystore password (e.g. generate via 1Password — must be stored)
- Key password (use the same)
- Distinguished name fields (CN, OU, O, L, ST, C — use real values, e.g. CN=Frederic Mamath, C=FR)

**Critical**:
- Store `popup-release.keystore` somewhere safe (1Password attachment, encrypted backup). Add to `.gitignore` — do NOT commit.
- Store the passwords in 1Password.
- Losing this keystore = cannot update the app anymore. Google Play has a recovery flow but it requires "Play App Signing" enrolment, which we set up below.

### 2. Configure signing in Gradle

After `npx expo prebuild --clean`, edit `android/gradle.properties` (regenerated each time — best to keep these in `~/.gradle/gradle.properties` instead, which is user-global and not regenerated):

```properties
POPUP_UPLOAD_STORE_FILE=/absolute/path/to/popup-release.keystore
POPUP_UPLOAD_KEY_ALIAS=popup
POPUP_UPLOAD_STORE_PASSWORD=<keystore_password>
POPUP_UPLOAD_KEY_PASSWORD=<key_password>
```

Edit `android/app/build.gradle` to reference these. (Expo prebuild generates a `signingConfigs.release` block referencing `POPUP_UPLOAD_*` variables — verify this exists after prebuild and add it if missing.)

### 3. Build the signed AAB

```bash
cd /Users/fredericmamath/freelance/whynot/ios-app
npx expo prebuild --clean
cd android
./gradlew bundleRelease
```

The output `.aab` lands at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

This is the file Google Play accepts (`.aab` = Android App Bundle, the modern format that replaces `.apk` for Play uploads).

### 4. Enrol in Play App Signing + upload

In Play Console → Popup → **Release → Setup → App signing**:
1. Choose **"Use Play App Signing"** (Google manages a master signing key; you upload with your own key, Google re-signs with theirs)
2. Upload your upload key certificate when prompted

Then in **Release → Testing → Internal testing → Create new release**:
1. Upload `app-release.aab`
2. **Release notes**: write a short French note ("Version initiale Android — live shopping pour acheteurs.")
3. Click **Next → Save → Review release → Start rollout to internal testing**

### 5. Add yourself as internal tester

In Internal testing → **Testers** tab:
1. Create a new email list, name it "Internal testers"
2. Add `fredericmamath@gmail.com`
3. Save → click the **opt-in URL** Play Console provides → opens Google Play Store
4. On the S23+, open the opt-in URL → "Devenir testeur" → install via the Play Store entry

### 6. Test all critical flows on the S23+

Test the same flows used in iOS review:

- [ ] Log in
- [ ] Watch a live stream (video renders — confirms ticket-003 works in production binary)
- [ ] Add a card via Google Pay (confirms ticket-004 works)
- [ ] Place a fixed-price purchase
- [ ] View order in /my-orders
- [ ] Delete account flow

### 7. Promote to production

Once internal testing confirms all flows:

1. In Play Console → **Release → Production → Create new release**
2. Promote from internal testing (same AAB) — or upload the same `.aab` again
3. Fill the same release notes
4. **Review release → Start rollout to Production**

Google Play will review the release. First reviews can take 1–3 days. After approval, the app is live on the Play Store.

## Out of Scope

- Multi-country distribution beyond France (start with FR only, expand later)
- Closed testing / open testing tracks (internal → production is sufficient for v1)
- Play Store optimization (ASO) and marketing assets beyond the required minimum
- Crash reporting integration (Firebase Crashlytics or similar — separate future ticket)
