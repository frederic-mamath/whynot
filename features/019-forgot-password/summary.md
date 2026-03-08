# 019 - Forgot Password

Allow users to reset their password via a secure email link. Mailjet sends a reset email with a time-limited token (1h). The flow includes a ForgotPasswordPage, email sending, and a ResetPasswordPage.

## Key Decisions

- **Mailjet** as email provider (basic template with reset link)
- **Token**: cryptographic random token stored hashed in DB, expires after 1 hour
- **Rate limiting**: 3 requests per 15 minutes per email
- **FRONTEND_URL** env variable for reset link domain
- **Security**: always respond 200 (no email enumeration), hash token in DB

| User Story                                                                                            | Status    |
| :---------------------------------------------------------------------------------------------------- | :-------- |
| As a developer, when I run migrations, the `password_reset_tokens` table is created                   | completed |
| As a user, when I submit my email on ForgotPasswordPage, I receive a reset email via Mailjet          | completed |
| As a user, when I click the link in the email, I land on ResetPasswordPage and can set a new password | completed |
| As a user, on ForgotPasswordPage I see the form and success state matching the design                 | completed |
| As a user, on ResetPasswordPage I can enter a new password and get redirected to login                | completed |
