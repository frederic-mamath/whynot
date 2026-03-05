# 017 - Google & Apple Authentication

Add Google and Apple Sign-In on the web platform, with Passport.js sessions replacing JWT, and account merge logic when email conflicts are detected between auth methods.

## Key Decisions

- **Web only** (mobile adapted later)
- **Passport.js + Express sessions** (migration from JWT)
- **Password nullable** for OAuth-only users
- **Merge OAuth→email**: After OAuth, detect conflict, ask for existing password
- **Merge email→OAuth**: Block email registration, ask re-login Google/Apple
- **Both methods remain active** after merge
- **Profile**: most recent connection method overwrites attributes (first name, last name)

| User Story                                                                                                 | Status    |
| :--------------------------------------------------------------------------------------------------------- | :-------- |
| As a developer, when I run migrations, the `auth_providers` table is created and password is nullable      | completed |
| As a user, when I log in with email/password, a session is created (httpOnly cookie)                       | completed |
| As a user, when I use the web app, sessions replace JWT tokens in localStorage                             | completed |
| As a user, when I click "Sign in with Google", I'm redirected to Google and logged in after consent        | completed |
| As a user, when I click "Sign in with Apple", I'm redirected to Apple and logged in after auth             | completed |
| As a user, I see Google and Apple sign-in buttons on Login and Register pages                              | completed |
| As a user with an email account, when I try Google login (same email), I'm asked to merge with my password | completed |
| As a user, after merge, I see the merge UI and can link my accounts                                        | completed |
