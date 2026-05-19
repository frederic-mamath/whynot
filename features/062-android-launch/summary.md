# Android Launch

## Status: BLOCKED (2026-05-19) — waiting on D&B for DUNS number

Tickets 002, 003, 004 are complete — the Android binary works end-to-end on the emulator: live streams render via the Kotlin `agora-viewer` port, and payment cards save via Google Pay. The remaining tickets (005 Play Console setup, 006 AAB upload + submission) cannot proceed until the DUNS number is issued by Dun & Bradstreet. Resume once the DUNS arrives.

## Initial Prompt

Launch the app on Android while the AppStore is reviewing the iOS submission, reusing the existing `ios-app/` Expo project. Buyer-only scope. Cost should include any required licences. Hardware: Samsung Galaxy S23+ already owned.

## Context

- The `ios-app/` directory is misnamed — it is an Expo project that already supports Android at the framework level (`app.config.ts > android.package` is set, RN/Expo are cross-platform). No fork or rename needed.
- The **hard blocker** for an Android launch is the custom `modules/agora-viewer/` native module: it had iOS Swift code only. Buyers cannot watch live streams on Android without a working Agora pipeline. See `docs/investigations/agora-ios26.md` for why this custom module was written in the first place.
- Cash cost: **$25 one-time** for Google Play Developer registration. Stripe / Agora / Cloudinary / EAS accounts are already paid for iOS and work on Android.
- **Hardware status (2026-05-18)**: the Samsung Galaxy S23+ is temporarily out of service. Phase 2 work proceeds on an Android emulator (AVD with Google Play system image). All tickets remain feasible on emulator EXCEPT the final "install from Play Store internal test link on a physical device" check in ticket-006, which is deferred until hardware is back.

## Phase 1 — PoC outcome (closed, 2026-05-18)

**Tested `react-native-agora` as a potential cross-platform replacement for the custom `agora-viewer` module.** Outcome: **unusable** — see `ticket-001.md` for full details. Summary:

- `react-native-agora@4.6.2` (the version targeting Agora SDK 4.6.2 with claimed iOS 26 support) cannot install in this project. Its podspec declares two pod dependencies (`AgoraVideo_Special_iOS@4.6.2.70` and `AgoraIrisRTC_iOS2@4.6.2-build.1`) that both ship the same Agora xcframeworks under identical names. CocoaPods refuses to install duplicates. This is an upstream packaging bug, independent of iOS 26 and independent of our custom module.
- `react-native-agora@4.5.4` (the previous npm `latest`) has the iOS 26 XCFramework incompatibility already documented in `docs/investigations/agora-ios26.md`.
- Both upstream paths are blocked for iOS for different reasons.

**Decision**: write a Kotlin Android implementation of `modules/agora-viewer/` (Phase 2 below) so the custom module works on both platforms. The custom module continues to be the canonical Agora integration; `react-native-agora` is set aside until upstream packaging is fixed.

## Phase 2 — Kotlin port path (in progress)

Five atomic tickets, sequential dependency: 002 → 003 → 004 → 005 → 006.

## Out of Scope

- **Seller flow on Android** — sellers continue on web. Mirror of iOS scope.
- **EAS Build / cloud builds** — local Gradle builds for Android, same as the iOS Xcode local-build flow.
- **EAS Update on Android** — separate concern, can be added later. Feature 060's OTA work is iOS-only for now.
- **Android tablet support** — phone-only, same constraint as iOS.
- **Migrating iOS off the custom module to `react-native-agora`** — deferred until upstream packaging is fixed; the custom module continues to be the canonical Agora integration on both platforms.
- **Replacing Apple Pay on iOS** — Apple Pay stays on iOS, Google Pay on Android, gated by `Platform.OS`.

## Tickets

| Ticket     | Description                                                                  | Status  |
| :--------- | :--------------------------------------------------------------------------- | :------ |
| ticket-001 | PoC `react-native-agora` on iOS 26 (additive, no production changes)         | done — blocked, see outcome |
| ticket-002 | Android dev environment + Kotlin stub for agora-viewer                       | done    |
| ticket-003 | Wire Agora Android SDK into agora-viewer Kotlin module                       | done    |
| ticket-004 | Apple Pay → Google Pay platform split                                        | done    |
| ticket-005 | Google Play Console account + first listing                                  | on hold (DUNS) |
| ticket-006 | Build + submit Android AAB to Play Store internal testing                    | on hold (DUNS) |

## User Stories

| User Story                                                                                                       | Status  |
| :--------------------------------------------------------------------------------------------------------------- | :------ |
| As a developer, I can determine whether `react-native-agora` is viable on iOS 26 without breaking production    | done — blocked upstream |
| As a buyer on Android (S23+), I can install the app and watch a live stream                                      | planned |
| As a buyer on Android, I can add a card via Google Pay and complete a purchase                                   | planned |
| As a developer, the Android app is published on the Google Play Store under the same brand as iOS                | planned |

## Cost summary

| Item | Cost |
|:---|:---|
| Google Play Developer registration | **$25 one-time** |
| Hardware (Samsung S23+) | €0 (owned) |
| Agora / Stripe / Cloudinary / EAS | €0 (existing accounts) |
| Phase 1 (PoC) effort | 0.5 day (done) |
| Phase 2 effort (tickets 002–006) | 5 days, sequential |
