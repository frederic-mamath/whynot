# ticket-003 — Onboarding

## Acceptance Criteria

- As a new user, after registering, when I land in the app for the first time, I should be redirected to the onboarding screen
- As a new user on the onboarding screen, when I enter a nickname and tap "Continue", I should reach the home tab
- As a returning user who completed onboarding, I should never see the onboarding screen again

## Technical Strategy

- Frontend
  - `app/_layout.tsx`
    - After resolving auth (user is logged in), also check `user.onboardingCompleted`
    - If `!user.onboardingCompleted`: redirect to `/onboarding` (outside tabs, full-screen)
    - Pattern: `useEffect` on `user` — when user changes, check and redirect
  - `app/onboarding.tsx`
    - Nickname `TextInput` (required, min 2 chars)
    - Optional avatar: `expo-image-picker` → base64 → `trpc.image.upload.useMutation()` → Cloudinary URL
    - `trpc.profile.completeOnboarding.useMutation({ nickname, avatarUrl? })`
    - On success: update user in `AuthContext` (re-fetch `profile.me`) → redirect to `/(tabs)`

## tRPC Procedures

- `profile.me()` → `{ onboardingCompleted: boolean, nickname: string | null, ... }`
- `profile.completeOnboarding(nickname, avatarUrl?)` → marks user as onboarded
- `image.upload(base64)` → `{ url: string }` — Cloudinary upload (used for optional avatar)

## Manual Operations

- None — Cloudinary is already configured on the backend
