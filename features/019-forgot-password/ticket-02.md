# Ticket 02 — Backend: Mailjet email service + forgot/reset tRPC endpoints

### Acceptance Criteria

- As a user, when I submit my email on ForgotPasswordPage, I receive a reset email via Mailjet containing a link to `/reset-password?token=xxx`
- As a user, the reset link expires after 1 hour
- As a user, when I submit a new password with a valid token, my password is updated and the token is consumed
- As a developer, the endpoint always returns success (no email enumeration)
- As a developer, requests are rate-limited to 3 per 15 minutes per email

### Technical Strategy

- Backend
  - Configuration
    - `.env` / Render environment variables
      - `MAILJET_API_KEY`: Mailjet public key
      - `MAILJET_SECRET_KEY`: Mailjet secret key
      - `MAILJET_FROM_EMAIL`: Sender email (e.g. noreply@whynot.app)
      - `MAILJET_FROM_NAME`: Sender name (e.g. WhyNot)
      - `FRONTEND_URL`: Frontend base URL (e.g. http://localhost:5173)
  - Service
    - `app/src/services/EmailService.ts`
      - `sendPasswordResetEmail(toEmail, resetToken)`: Send email via Mailjet v3.1 API (node-mailjet) with basic HTML template containing the reset link and a short message
  - Service
    - `app/src/services/PasswordResetService.ts`
      - `requestReset(email)`: Generate crypto token → hash it → save in DB → send email. Always return success.
      - `resetPassword(plainToken, newPassword)`: Find all valid (non-expired, non-used) tokens → compare with bcrypt → update password → mark token used
  - Router
    - `app/src/routers/auth.ts`
      - `forgotPassword` (publicProcedure): Input `{ email }`, calls `PasswordResetService.requestReset`. Rate-limited (in-memory map: 3 per 15 min per email).
      - `resetPassword` (publicProcedure): Input `{ token, password }`, calls `PasswordResetService.resetPassword`
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `updatePassword(userId, hashedPassword)`: Update user password field
  - Dependencies
    - `node-mailjet` — Mailjet Node.js SDK

### Manual operations to configure services

#### Mailjet

- **Mailjet Dashboard** (https://app.mailjet.com)
  1. Create a Mailjet account (free tier: 200 emails/day)
  2. Go to "Account Settings" > "REST API" > "API Key Management"
  3. Copy the API Key (public) and Secret Key
  4. Go to "Sender domains & addresses" > Add and verify a sender email (e.g. noreply@whynot.app)
  5. Add to `.env`:
     ```
     MAILJET_API_KEY=xxx
     MAILJET_SECRET_KEY=xxx
     MAILJET_FROM_EMAIL=noreply@whynot.app
     MAILJET_FROM_NAME=WhyNot
     FRONTEND_URL=http://localhost:5173
     ```
  6. Add the same values to Render environment variables for staging/production
