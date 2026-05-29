# Ticket 001 — PostHog SDK install + GDPR-safe init + identity stitching

## Goal

Install `posthog-react-native`, initialize it in **anonymous-until-identified** mode (no consent banner needed under GDPR Option A), and wire identity calls into the auth lifecycle so iOS users dedupe with web users in PostHog.

No business events fire yet — that's ticket 002. After this ticket, opening the app pre-login produces zero PostHog events. After login, the user is identified and any future events will be properly attributed.

## Acceptance Criteria

- As an operator, when a logged-out user opens the app, no event is sent to PostHog (verify in PostHog Live view)
- As an operator, when a user successfully logs in, PostHog receives an `$identify` event with the user's id and a `role` property (either `BUYER` or `SELLER` based on `role.myRoles`)
- As an operator, when a user successfully signs up, PostHog receives an `$identify` event with the same shape
- As an operator, when a user logs out, PostHog receives a `reset()` call (so a subsequent login from a different account doesn't carry over identity)
- As a developer, calling `usePostHog()` anywhere in the app returns a non-null instance (gracefully no-ops when `EXPO_PUBLIC_POSTHOG_KEY` is unset, so local dev without the env var doesn't crash)
- `npx tsc --noEmit` passes with zero errors
- `npx expo prebuild --clean 2>&1 | tail -20` completes without errors (the SDK may pull in native pods)

## Technical Strategy

- Install — from `ios-app/`:
  ```bash
  npm install posthog-react-native
  ```
  Note: recent versions of `posthog-react-native` ship a pure-JS path that does not require prebuild. Still re-run prebuild because we're adding env vars and want a clean baseline.

- Env vars — `ios-app/app.config.ts` (modify)
  - Add to `extra`:
    ```ts
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    ```
  - `EXPO_PUBLIC_*` vars are baked at build time and accessible via `process.env` directly — no `Constants.expoConfig.extra` round-trip needed.

- Provider wiring — `ios-app/app/_layout.tsx` (modify)
  - Import `PostHogProvider` from `posthog-react-native`
  - Wrap the existing root tree:
    ```tsx
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY ?? ""}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
        // GDPR Option A — anonymous-until-identified, no consent banner needed
        personProfiles: "identified_only",
        disableGeoip: false, // PostHog uses GeoIP from server IP, anonymized in identified_only
        captureAppLifecycleEvents: false, // no anonymous lifecycle events
        captureScreens: false,            // no anonymous pageviews
      }}
      autocapture={false}
    >
      {/* existing children */}
    </PostHogProvider>
    ```
  - If `EXPO_PUBLIC_POSTHOG_KEY` is empty, render the children without the provider so local dev works without env config.

- Auth lifecycle — `ios-app/src/contexts/AuthContext.tsx` (modify)
  - Pull the PostHog instance via `usePostHog()` inside the context
  - On successful login (`loginMutation.onSuccess`): call `posthog.identify(user.id.toString(), { role: userRole })` — `userRole` comes from `role.myRoles` (call right after login completes)
  - On successful sign-up (`registerMutation.onSuccess`): same `posthog.identify` call
  - On logout: call `posthog.reset()`
  - **Note**: the existing `AuthContext` already exposes login/logout. Hook these calls into the existing success handlers; do not refactor the context.

- Server-side ENV — README / `.env.example` (modify if it exists)
  - Add the new env vars so the next developer knows to set them.

## Verification

```bash
cd ios-app
npx tsc --noEmit                    # zero errors
npx expo prebuild --clean 2>&1 | tail -20   # completes cleanly
```

Manual:
1. Set `EXPO_PUBLIC_POSTHOG_KEY` to a real test project key in `.env`
2. Run on simulator → open the app cold → PostHog Live view shows **zero** events
3. Tap Login → enter credentials → PostHog Live view shows `$identify` with the user's id and role
4. Tap Logout from profile → next login from a different account does not carry over the prior identity (a new `$identify` arrives, prior person's events do not mix)

## Manual operations to configure services

**PostHog dashboard**:
1. Create a project at https://eu.posthog.com (EU instance — already used by web)
2. Copy the project API key (starts with `phc_`)
3. Add to `.env`:
   ```
   EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
   EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```
4. For TestFlight builds: add the same vars to `eas.json` under the appropriate build profile's `env`.
5. For production builds: add the production project's key (or reuse the same project — your call).
