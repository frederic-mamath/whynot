# ticket-003 — Mobile: wire OAuth buttons on welcome / login / register screens

## Acceptance Criteria

- As a buyer on iOS, in the welcome / login / register screens, I see "Continuer avec Apple" (black button, Apple logo) above the email/password fields
- As a buyer on iOS or Android, I see "Continuer avec Google" (white button, Google logo) below the Apple button on iOS, or above the email/password fields on Android
- As a buyer on iOS, when I tap "Continuer avec Apple", the native Sign In with Apple sheet appears; on success I'm logged in (JWT stored, navigated to home or onboarding)
- As a buyer on iOS or Android, when I tap "Continuer avec Google", the native Google account picker appears; on success I'm logged in
- As a buyer with an existing email/password account, when I sign in via OAuth using the same email, my account is **auto-linked** (no merge prompt) and the new provider is added to my `auth_providers` rows. Verified by signing in via OAuth then later via email/password — both should land on the same user.
- As a developer, the Apple button is hidden on Android via `Platform.OS === "ios"` check
- As a developer, when the user cancels the native sheet, the UI quietly returns to the auth screen with no error message (canceling is not a failure)
- As a developer, when the network or token exchange fails, the user sees a French error message via `Alert.alert`
- As a developer, `npx tsc --noEmit` passes with zero errors

## Technical Strategy

- iOS App (`ios-app/`)
  - Shared helper
    - `ios-app/src/lib/socialAuth.ts` *(create)*
      - `export async function signInWithApple(): Promise<{ identityToken: string; firstName?: string; lastName?: string }>` — wraps `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })`. Returns the identity token + optional name fields (Apple sends them only on the first sign-in for a given user).
      - `export async function signInWithGoogle(): Promise<{ idToken: string }>` — wraps `GoogleSignin.configure({ webClientId, iosClientId })` (called once on module load) + `GoogleSignin.signIn()`. Returns the ID token.
      - Both functions throw a custom `SocialAuthCanceledError` when the user cancels (Apple returns `ERR_REQUEST_CANCELED`, Google's SDK throws with `statusCode === SIGN_IN_CANCELLED`). Callers catch this and silently noop.
      - All other errors are rethrown for the UI to catch and display.
  - Shared component
    - `ios-app/src/components/SocialAuthButtons.tsx` *(create)*
      - Renders the Apple button (iOS only) and the Google button.
      - Internal state: `loading: "apple" | "google" | null` to disable other buttons during a flow.
      - On tap → calls the helper, then `trpc.auth.appleSignIn` / `trpc.auth.googleSignIn`, then `AuthContext.login(token, user)`. (May need to add `login(token, user)` overload to `AuthContext` — see below.)
  - Auth context update
    - `ios-app/src/contexts/AuthContext.tsx`
      - Add a method `signInWithToken(token: string, user: { id, email, ... })` that stores the token in `expo-secure-store` and updates state — same persistence as the existing email/password login but skips the password mutation. Callers (OAuth flows) use this after they have a JWT from the backend.
      - If the existing `AuthContext.login` already accepts a token directly, reuse it; otherwise add the new method.
  - View
    - `ios-app/app/(auth)/welcome.tsx` — add `<SocialAuthButtons />` near the bottom of the screen with a "ou" divider above the existing "Connexion / Inscription" buttons
    - `ios-app/app/(auth)/login.tsx` — add `<SocialAuthButtons />` above the email field with a "ou" divider below
    - `ios-app/app/(auth)/register.tsx` — same as login
  - Styling
    - Apple button: 50pt black `Pressable` with white Apple logo (use the `apple-icon` from `expo-apple-authentication`'s `AppleAuthentication.AppleAuthenticationButton` if it works in the New Architecture; otherwise a custom Pressable with the Apple SF Symbol via emoji ` ` or an SVG. Match Apple's HIG colors.)
    - Google button: 50pt white `Pressable` with `#DADCE0` border, "G" icon (use `react-native-svg` if not already in deps, or a static asset).

## Manual operations to configure services

None at this ticket — all OAuth client configuration is done in ticket-002.

## Out of Scope

- Linking a second OAuth provider after first sign-in (e.g., user signed up with Google, later wants to also connect Apple from the Profile screen) — separate later feature.
- Showing which providers are linked in the Profile screen.
- "Forgot password" flow for accounts that were created via OAuth (they have no password — UI should already handle this case via the existing `oauth_account_exists:<providers>` error code from `auth.register`).
- Sign In with Apple on Android (Apple doesn't support a native flow there; would require a browser-based redirect we're not implementing).
