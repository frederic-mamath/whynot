# ticket-002 — Authentication

## Acceptance Criteria

- As a new user, on the welcome screen, when I tap "Sign up", I should be able to create an account with email + password
- As an existing user, on the login screen, when I enter correct credentials, I should reach the home tab
- As a logged-in user, when I reopen the app, I should still be logged in (token persisted in SecureStore)
- As a logged-in user, on the profile tab, when I tap "Log out", I should return to the welcome screen

## Technical Strategy

- Frontend
  - `src/contexts/AuthContext.tsx`
    - `AuthContext`: provides `user`, `isLoading`, `login(token, user)`, `logout()`
    - On mount: reads token from `SecureStore` → calls `trpc.auth.me()` to validate → sets user state
    - `login()`: saves token via `setToken()`, sets user in state
    - `logout()`: calls `removeToken()`, clears user state
  - `app/_layout.tsx`
    - Wraps with `AuthProvider`
    - If `isLoading`: show splash/loading screen
    - If not authenticated: redirect to `/(auth)/welcome`
    - If authenticated: render `(tabs)` layout
  - `app/(auth)/_layout.tsx`: Stack navigator for auth screens
  - `app/(auth)/welcome.tsx`
    - "Log in" button → navigate to `/(auth)/login`
    - "Create account" button → navigate to `/(auth)/register`
  - `app/(auth)/login.tsx`
    - Email + password TextInputs
    - `trpc.auth.login.useMutation()` → on success: `AuthContext.login(token, user)` → replace to `/(tabs)`
    - Show error message on failure
  - `app/(auth)/register.tsx`
    - Email + password + CGU checkbox
    - `trpc.auth.register.useMutation({ email, password, acceptedCgu: true })` → on success: `AuthContext.login(token, user)` → replace to `/(tabs)`

## tRPC Procedures

- `auth.login(email, password)` → `{ token: string, user: { id, email, ... } }`
- `auth.register(email, password, acceptedCgu: true)` → `{ token: string, user: { id, email, ... } }`
- `auth.me()` → current user (used on startup to validate stored token)

## Manual Operations

- None
