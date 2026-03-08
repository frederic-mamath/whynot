# Ticket 04 — Frontend: ResetPasswordPage (new password form)

### Acceptance Criteria

- As a user, when I click the reset link in my email, I land on `/reset-password?token=xxx` and see a form with: back link to login, title "Nouveau mot de passe" in font-syne bold, description, two password inputs (new password + confirmation) with Lock icon, and "Réinitialiser" ButtonV2 (primary style)
- As a user, if passwords don't match, I see a client-side validation error
- As a user, if the password is less than 6 characters, I see a validation error
- As a user, after successful reset, I see a success message and I'm redirected to `/login`
- As a user, if the token is invalid or expired, I see an error message with a link to request a new reset

### Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/ResetPasswordPage/ResetPasswordPage.tsx`
      - Reads `token` from URL query params via `useSearchParams()`
      - Two states: `"form"` and `"success"`
      - **Form state**: same layout style as ForgotPasswordPage — `ArrowLeft` + "Retour" link to `/login`, title, two `<Input>` (password + confirm, Lock icon), `<ButtonV2>` "Réinitialiser"
      - **Success state**: green checkmark, "Mot de passe modifié !", description, `<ButtonV2>` "Se connecter" (navigates to `/login`)
      - **Error state**: if mutation returns token_expired/token_invalid error, show message + link to `/forgot-password`
      - Calls `trpc.auth.resetPassword.useMutation()` on submit
  - Routing
    - `app/client/src/App.tsx`
      - Add `<Route path="/reset-password" element={<ResetPasswordPage />} />`
      - Import `ResetPasswordPage`

### Manual operations to configure services

None.
