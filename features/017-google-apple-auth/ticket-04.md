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

#### Google (local + staging)

- **Google Cloud Console** (https://console.cloud.google.com)
  1. Create or select a project
  2. Go to "APIs & Services" > "Credentials"
  3. Create OAuth 2.0 Client ID (Web application type)
  4. Under "Authorized redirect URIs", add:
     - `http://localhost:3000/auth/google/callback` (local dev)
     - `https://whynot-app.onrender.com/auth/google/callback` (staging)
  5. Copy Client ID and Client Secret to `.env` (local) and Render environment variables (staging):
     ```
     GOOGLE_CLIENT_ID=xxx
     GOOGLE_CLIENT_SECRET=xxx
     ```

#### Apple (local + staging)

Apple Sign In requires an Apple Developer account (paid, $99/year) and cannot be tested on `localhost` directly — a publicly accessible HTTPS domain is required even in development. Use the staging URL for all testing.

- **Apple Developer Console** (https://developer.apple.com/account)

  **Step 1 — Create an App ID**
  1. Go to "Certificates, Identifiers & Profiles" > "Identifiers"
  2. Click "+" → Select "App IDs" → "App"
  3. Bundle ID (explicit): e.g. `com.whynot.app`
  4. Enable the "Sign In with Apple" capability
  5. Save

  **Step 2 — Create a Services ID (Web OAuth client)**
  1. Go to "Identifiers" → Click "+" → Select "Services IDs"
  2. Identifier: e.g. `com.whynot.web` — this becomes `APPLE_CLIENT_ID`
  3. Enable "Sign In with Apple" and click "Configure"
  4. Primary App ID: select the App ID from Step 1
  5. Under "Domains and Subdomains", add:
     - `whynot-app.onrender.com`
  6. Under "Return URLs", add:
     - `https://whynot-app.onrender.com/auth/apple/callback`
  7. Save and continue

  **Step 3 — Create a Sign In with Apple private key**
  1. Go to "Keys" → Click "+"
  2. Name the key (e.g. `WhyNot Apple Sign In Key`)
  3. Enable "Sign In with Apple" → Configure → Select the App ID from Step 1
  4. Register and **download the key file** (`.p8`) — it can only be downloaded once
  5. Note the **Key ID** (10-character string) — this becomes `APPLE_KEY_ID`
  6. Note your **Team ID** (visible in the top-right of the Developer portal) — this becomes `APPLE_TEAM_ID`

  **Step 4 — Set environment variables**

  For staging on Render, add these environment variables in the Render dashboard:

  ```
  APPLE_CLIENT_ID=com.whynot.web
  APPLE_TEAM_ID=XXXXXXXXXX
  APPLE_KEY_ID=XXXXXXXXXX
  APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  ```

  For local development, add to `.env`. Because Apple requires HTTPS, use the staging URL for end-to-end testing. You can use `ngrok` to expose localhost over HTTPS if needed:

  ```bash
  ngrok http 3000
  # Then add the ngrok HTTPS URL to Apple Services ID redirect URIs
  ```

> **Note:** Changes to Apple's redirect URIs take ~a few minutes to propagate. Always test Apple Sign In on `https://whynot-app.onrender.com` first.
