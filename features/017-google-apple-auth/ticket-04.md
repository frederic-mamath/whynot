# Ticket 04 — Backend: Google OAuth (Passport strategy + Express routes)

### Acceptance Criteria

- As a user, when I click "Sign in with Google", I'm redirected to Google consent screen
- As a user, after Google consent, I'm redirected back to the app and logged in with a session
- As a user, if it's my first Google login, a new account is created without a password
- As a user, if a conflict is detected (email exists with different auth method), I'm redirected to /account-merge page

### Technical Strategy

- Backend
  - Repository
    - `app/src/repositories/AuthProviderRepository.ts`
      - `findByProviderAndProviderId(provider, providerUserId)`: Find auth provider entry
      - `findByUserId(userId)`: Find all providers for a user
      - `save(userId, provider, providerUserId, providerEmail)`: Create auth provider entry
  - Configuration
    - `app/src/config/passport.ts`
      - Add GoogleStrategy with clientID, clientSecret, callbackURL
  - Routes
    - `app/src/routes/oauth.ts`
      - `GET /auth/google` → passport.authenticate('google', { scope: ['profile', 'email'] })
      - `GET /auth/google/callback` → passport.authenticate + handle new user / existing user / conflict
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `saveOAuthUser(email, firstName, lastName)`: Create user without password

### Manual operations to configure services

- **Google Cloud Console** (https://console.cloud.google.com)
  1. Create or select a project
  2. Go to "APIs & Services" > "Credentials"
  3. Create OAuth 2.0 Client ID (Web application type)
  4. Add authorized redirect URI: `http://localhost:3000/auth/google/callback` (dev)
  5. Add production redirect URI when deploying
  6. Copy Client ID and Client Secret to `.env`:
     - `GOOGLE_CLIENT_ID=xxx`
     - `GOOGLE_CLIENT_SECRET=xxx`
