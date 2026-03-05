# Ticket 02 — Backend: Express sessions + Passport.js configuration

### Acceptance Criteria

- As a user, when I log in with email/password, a session is created (httpOnly cookie)
- As a developer, JWT remains functional as a fallback (mobile)
- As a developer, the tRPC context reads userId from the session OR JWT header

### Technical Strategy

- Backend
  - Configuration
    - `package.json`
      - Add: `express-session`, `connect-pg-simple`, `passport`, `@types/passport`, `@types/express-session`
    - `app/src/config/passport.ts`
      - `serializeUser`: Store user.id in session
      - `deserializeUser`: Find user by id from DB
    - `app/src/index.ts`
      - Add express-session middleware with connect-pg-simple (PostgreSQL store)
      - Add passport.initialize() + passport.session()
      - Update CORS with `credentials: true`
      - Update `createContext` to read `req.session.passport.user` OR JWT header
      - Pass `req` in tRPC context for session access in routers
    - `app/src/types/context.ts`
      - Extend Context with `req?: express.Request`
  - Router
    - `app/src/routers/auth.ts`
      - `auth.login`: After password verification, set `req.session.passport.user`
      - `auth.register`: After user creation, set session
      - `auth.logout`: New endpoint to destroy session

### Manual operations to configure services

- None (session table is auto-created by connect-pg-simple)
