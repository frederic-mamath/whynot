# Mobile OAuth — Google + Apple Sign-In

## Initial Prompt

As a user, I would like to login with Google and Apple on the mobile app. This behavior already exists in the web app.

## Context

The web app supports OAuth via Passport.js with HTTP redirects + session cookies (`/auth/google/callback`, `/auth/apple/callback`, `accountMergeService`). That model does not translate to mobile native — mobile uses JWT in `expo-secure-store`, not session cookies, and the native SDKs return an ID token directly on the device rather than going through a browser redirect.

The mobile flow therefore needs **new tRPC procedures** (`auth.googleSignIn`, `auth.appleSignIn`) that accept an ID token, verify it server-side, look up or create the user, and return `{ user, token }` — the same shape as the existing `auth.login` / `auth.register`. All the underlying repositories (`userRepository.saveOAuthUser`, `authProviderRepository.save` / `findByProviderAndProviderId`) are reused — only the verification + JWT issuance is new.

## Policy nuance vs web

The web flow does **not** auto-link by default. When OAuth returns an email matching an existing user, the web redirects to `/account-merge?provider=...&token=...` for an explicit confirmation prompt (via `accountMergeService` + `generateMergeToken`). The mobile flow **auto-links** without confirmation — explicit product decision. End-state is the same (one user, multiple providers) but the UX diverges. Documented so future readers don't treat it as a bug.

## Provider × platform matrix

| Provider | iOS | Android |
|:---|:---|:---|
| Google | ✓ | ✓ |
| Apple | ✓ (App Store guideline 4.8 requires it when any other social sign-in is offered) | ✗ |

## Out of Scope

- **Account merge confirmation UI on mobile** — auto-link is the explicit choice.
- **"Hide My Email"** Apple relay support — backend assumes real emails are returned.
- **Seller flow** — buyers only, sellers continue on web.
- **Web's session-cookie OAuth path** — stays untouched. Web users keep using Passport redirects.
- **Profile "Connect another provider" UI** — linking an additional provider after first sign-in from the Profile screen is a separate later feature. Linking by matching email at sign-in time is in scope.

## Dependencies (rollout — not code)

- **iOS rollout** requires a new binary submission. Currently feature 060 (EAS Update) is on hold pending the 1.0.2 App Store review. New native modules → new prebuild → new binary → new submission.
- **Android rollout** is blocked on feature 062 (Google Play Console setup waiting for DUNS issuance).
- **Code can land any time**, the rollout is gated by the same App Store / Play Store gates already in flight on features 060 and 062.

## Tickets

| Ticket     | Description                                                                  | Status  |
| :--------- | :--------------------------------------------------------------------------- | :------ |
| ticket-001 | Backend: `auth.googleSignIn` + `auth.appleSignIn` tRPC mutations             | done    |
| ticket-002 | Mobile: install + configure native OAuth packages (manual provider setup)    | planned |
| ticket-003 | Mobile: wire OAuth buttons on welcome / login / register screens             | planned |

## User Stories

| User Story                                                                                                       | Status  |
| :--------------------------------------------------------------------------------------------------------------- | :------ |
| As a buyer on iOS, I can sign up or log in with Apple via the native Sign In with Apple sheet                   | planned |
| As a buyer on iOS or Android, I can sign up or log in with Google via the native Google sheet                   | planned |
| As an existing buyer (email + password) using OAuth for the first time with the same email, my accounts auto-link | planned |
