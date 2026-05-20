# ticket-001 — Backend: `auth.googleSignIn` + `auth.appleSignIn` tRPC mutations

## Acceptance Criteria

- As a mobile client, when I call `auth.googleSignIn({ idToken })` with a valid Google ID token, the backend verifies it against Google's public keys, looks up the existing `auth_providers` row by `(provider="google", providerId=sub)`, and returns `{ user, token }` (JWT) — same shape as `auth.login`
- As a mobile client, when I call `auth.appleSignIn({ idToken, firstName?, lastName? })` with a valid Apple ID token, the backend verifies it against Apple's JWKS, applies the same lookup logic, and returns the same `{ user, token }` shape
- As a developer, when the verified email matches an existing user (any auth method), the new provider is **auto-linked** to that user (no merge confirmation step, divergent from web — see summary)
- As a developer, when no user exists with the verified email, a new OAuth user is created via `userRepository.saveOAuthUser` and the provider is linked via `authProviderRepository.save`
- As a developer, when the ID token is invalid (bad signature, expired, wrong audience), the mutation throws `UNAUTHORIZED` with a clear message
- As a developer, `npm run build:server` passes with zero errors

## Technical Strategy

- Backend (`app/src/`)
  - Packages
    - `app/package.json`
      - Install `google-auth-library` (Google's official Node SDK for verifying ID tokens)
      - Install `jose` (modern JWT/JWKS library for verifying Apple's ID tokens)
  - Service
    - `app/src/services/MobileOAuthService.ts` *(create)*
      - `verifyGoogleIdToken(idToken: string): Promise<{ providerId, email, firstName, lastName }>`
        - Uses `OAuth2Client.verifyIdToken({ idToken, audience: [GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID] })` — accepts tokens issued for any of our mobile OAuth clients
        - Throws on signature/expiry/audience failure
        - Extracts `sub`, `email`, `given_name`, `family_name` from the verified payload
      - `verifyAppleIdToken(idToken: string): Promise<{ providerId, email }>`
        - Uses `jose.createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"))` + `jose.jwtVerify(idToken, jwks, { issuer: "https://appleid.apple.com", audience: APPLE_BUNDLE_ID })`
        - Throws on signature/expiry/audience failure
        - Extracts `sub`, `email` from verified payload
      - Required env vars (throw at module load if missing, mirror existing `JWT_SECRET` pattern in `src/utils/auth.ts`):
        - `GOOGLE_IOS_CLIENT_ID`
        - `GOOGLE_ANDROID_CLIENT_ID`
        - `GOOGLE_WEB_CLIENT_ID` (optional — reused as `serverClientId` for mobile)
        - `APPLE_BUNDLE_ID` (= `fr.mamath.popup`)
  - Router
    - `app/src/routers/auth.ts`
      - `googleSignIn: publicProcedure.input(z.object({ idToken: z.string().min(1) })).mutation(async ({ input }) => { ... })`
      - `appleSignIn: publicProcedure.input(z.object({ idToken: z.string().min(1), firstName: z.string().optional(), lastName: z.string().optional() })).mutation(...)`
      - Both procedures share a helper `signInOrLinkOAuth(provider, providerId, email, firstName, lastName)`:
        1. `authProviderRepository.findByProviderAndProviderId(provider, providerId)` → if found, fetch user, return `{ user, token: generateToken(user.id) }`
        2. Else `userRepository.findByEmail(email)` → if found, **auto-link** via `authProviderRepository.save(user.id, provider, providerId, email)`, return `{ user, token: generateToken(user.id) }`
        3. Else create new user via `userRepository.saveOAuthUser(email, firstName, lastName)`, link provider, return `{ user, token }`
      - **Do NOT** set `ctx.req.session.passport` for these mobile-only routes — mobile uses JWT, not sessions. Skip the session block entirely.
      - On Google verify failure: `throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Google token" })`
      - On Apple verify failure: same with "Invalid Apple token"
  - Wiring
    - `app/src/services/index.ts` — export `mobileOAuthService` singleton (if not already exporting services there; otherwise import the file directly in `auth.ts`)

## Manual operations to configure services

Three env vars must be set on every environment (dev `.env`, Render staging, Render production):

```bash
GOOGLE_IOS_CLIENT_ID=...        # from Google Cloud Console — created in ticket-002
GOOGLE_ANDROID_CLIENT_ID=...    # from Google Cloud Console — created in ticket-002
GOOGLE_WEB_CLIENT_ID=...        # from Google Cloud Console — created in ticket-002 (optional fallback audience)
APPLE_BUNDLE_ID=fr.mamath.popup # matches ios.bundleIdentifier in ios-app/app.config.ts
```

These values are produced in ticket-002 (Apple Developer Portal + Google Cloud Console). Ticket-001 can be implemented and pass `npm run build:server` immediately; the env vars are only required at runtime.
