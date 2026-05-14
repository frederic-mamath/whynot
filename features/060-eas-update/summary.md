# EAS Update Setup

## Initial Prompt

Set up Expo EAS Update (free tier) so that JavaScript-only changes can be pushed directly to users without going through App Store review. Every future JS/UI/feature change deploys in minutes via `eas update` instead of waiting 1–3 days for Apple.

## Context

- Current stack: Expo SDK, React Native, `npx expo prebuild` + Xcode Archive for binary builds
- `expo-updates` is not yet installed — the current 1.0.1 binary cannot receive OTA updates
- One new binary (1.0.2) must be submitted to the App Store to bake in the update client; after that, JS changes bypass review entirely
- Using the free tier of EAS Update (sufficient for current user base)

## What changes with OTA updates

| Change type | Before | After |
|:---|:---|:---|
| Bug fix / UI change / new screen | New binary → App Store review (1–3 days) | `eas update` → live in minutes |
| New native module / new permission | New binary → App Store review | New binary → App Store review (unchanged) |

## Out of Scope

- EAS Build (cloud builds) — binary builds stay local via Xcode
- Preview / staging channels — production channel only for now
- Android — iOS only

## Tickets

| Ticket     | Description                                              | Status  |
| :--------- | :------------------------------------------------------- | :------ |
| ticket-001 | Create Expo account and initialize EAS project           | planned |
| ticket-002 | Install expo-updates and configure app.config.ts + eas.json | planned |
| ticket-003 | Build and submit 1.0.2 binary with expo-updates baked in | planned |
| ticket-004 | Push first OTA update and verify it lands on device      | planned |

## User Stories

| User Story                                                                                          | Status  |
| :-------------------------------------------------------------------------------------------------- | :------ |
| As a developer, I can push a JS-only change to production users without submitting to the App Store | planned |
| As a developer, a new binary automatically receives future OTA updates via the production channel   | planned |
