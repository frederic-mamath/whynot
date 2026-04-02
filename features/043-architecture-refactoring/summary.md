# Feature 043 — Architecture Refactoring & Codebase Consistency

## Initial Prompt

> "Let's prepare a feature of refactoring to keep the architecture consistent. I want you to go through the codebase, identify patterns, identify inconsistent places that doesn't match with the pattern and identify problems with the current stack. Then you will suggest improvements with explanation so I can challenge you."

---

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a developer, the backend routers should only access the DB through repositories, not directly | completed |
| As a developer, platform fee logic should exist in one place only | completed |
| As a developer, `auth.me` and `message.subscribe` should use `protectedProcedure` | completed |
| As a developer, `JWT_SECRET` missing at startup should throw instead of defaulting silently | completed |
| As a developer, repository update methods should not use `any` types | completed |
| As a developer, all pages should follow the Page.tsx + Page.hooks.ts pattern | completed |
| As a developer, status colors should use design tokens, not raw Tailwind classes | completed |
| As a developer, the `seller_onboarding_data` table should have an explicit migration | completed (already existed in 036) |
| As a developer, Stripe webhooks should be idempotent on duplicate delivery | completed |
