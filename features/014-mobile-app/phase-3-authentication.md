# Phase 3: Authentication System

## Objective

Implement JWT-based authentication using `expo-secure-store` with login, register, and auto-login screens, plus an AuthContext that manages the auth state globally.

## User-Facing Changes

- Login screen (email + password)
- Register screen (email + password + first/last name)
- Auto-redirect: unauthenticated → login, authenticated → main tabs
- Logout button (integrated later in Phase 5 profile screen)

## Files to Update

### Frontend (mobile-app/)

- `src/lib/auth.ts` — `getToken()`, `setToken()`, `removeToken()` via `expo-secure-store`
- `src/contexts/AuthContext.tsx` — React Context with user, token, login/register/logout
- `app/(auth)/_layout.tsx` — Auth group layout (Stack, no header)
- `app/(auth)/login.tsx` — Login screen
- `app/(auth)/register.tsx` — Register screen
- `app/_layout.tsx` — Update root layout with AuthContext provider + redirect logic

## Steps

1. Create `src/lib/auth.ts` with SecureStore-based token management
2. Create `AuthContext` with login/register/logout actions calling tRPC `auth.*`
3. Create auth group layout `(auth)/_layout.tsx`
4. Build login screen with form validation
5. Build register screen with form validation
6. Implement redirect logic in root layout (check token on mount)
7. Test full auth flow

## Acceptance Criteria

- [ ] Login with valid credentials stores JWT and navigates to main app
- [ ] Register creates account and navigates to main app
- [ ] Invalid credentials show error message
- [ ] App restart with valid token auto-logs in (calls `auth.me`)
- [ ] Expired/invalid token redirects to login

## Status

✅ DONE
