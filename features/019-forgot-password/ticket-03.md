# Ticket 03 — Frontend: ForgotPasswordPage (form + success state)

### Acceptance Criteria

- As a user, when I navigate to `/forgot-password`, I see the "Mot de passe oublié" page with: back link ("Retour" with ArrowLeft icon), title in font-syne bold, description in muted text, email Input with Mail icon, and "Envoyer le lien" ButtonV2 (primary style)
- As a user, at the bottom of the page I see "Tu te souviens ? Se connecter" with the link in primary color
- As a user, when I submit the form, I see the success state: centered layout with a green checkmark circle, "Email envoyé !" title in font-syne bold, description mentioning checking spam, "Retour à la connexion" ButtonV2 (primary style), and "Pas reçu ? Renvoyer l'email" link at the bottom (pink/primary color)
- As a user, clicking "Renvoyer l'email" triggers a new reset email request
- As a user, if the email is invalid format, the form shows a validation error client-side

### Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/ForgotPasswordPage/ForgotPasswordPage.tsx`
      - Two states managed via `useState<"form" | "success">`
      - **Form state**: matches LoginPage layout — `ArrowLeft` + "Retour" link, title, description, `<Input>` (email, Mail icon), `<ButtonV2>` "Envoyer le lien"
      - **Success state**: centered flex layout — green circle with `Check` Lucide icon, title "Email envoyé !", description, `<ButtonV2>` "Retour à la connexion" (navigates to `/login`), "Pas reçu ? Renvoyer l'email" button at bottom
      - Calls `trpc.auth.forgotPassword.useMutation()` on submit
      - Stores submitted email in state to support "Renvoyer l'email"
  - Routing
    - `app/client/src/App.tsx`
      - Add `<Route path="/forgot-password" element={<ForgotPasswordPage />} />`
      - Import `ForgotPasswordPage`

### Manual operations to configure services

None.
