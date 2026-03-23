# Ticket 001 — DB migration + progress UI shell + Step 0 (accept rules)

## Acceptance Criteria

- As a user, in `/vendre`, when I click "Commencer à vendre", I should be redirected to `/seller-onboarding`.
- As a user, in `/seller-onboarding`, I should see a progress bar and a list of all 11 steps, with the current step highlighted and future steps locked.
- As a potential seller (Step 0), in `/seller-onboarding`, when I read the platform rules and click "J'accepte les règles", the step card should bounce with the brand primary color, and I should advance to step 2.
- As a system, when a user accepts the rules, `seller_onboarding_step` should be set to `1` and `accepted_seller_rules_at` should be recorded in PostgreSQL.
- As a user, when I refresh `/seller-onboarding` after accepting the rules, step 0 should remain marked as completed.

## Technical Strategy

- Backend
  - Migration
    - `app/migrations/036_add_seller_onboarding.ts`
      - Adds `seller_onboarding_step INTEGER NOT NULL DEFAULT 0` and `accepted_seller_rules_at TIMESTAMPTZ` to `users`.
      - Creates `seller_onboarding_data` table with survey fields for steps 2–10 (category, sub_category, seller_type, selling_channels, monthly_revenue_range, item_count_range, team_size_range, live_hours_range, return_street, return_city, return_zip_code, return_country).
  - Types
    - `app/src/db/types.ts`
      - Adds `seller_onboarding_step` and `accepted_seller_rules_at` to `UsersTable`.
      - Adds `SellerOnboardingDataTable` interface and registers it in `Database`.
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `updateSellerOnboardingStep(userId, step, extra?)`: Updates `seller_onboarding_step` and optionally `accepted_seller_rules_at`.
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `getProgress` (protectedProcedure query): Returns `{ step, acceptedRulesAt }`.
      - `acceptRules` (protectedProcedure mutation): Guards against double-accept, sets step to `1` and `accepted_seller_rules_at`.
    - `app/src/routers/index.ts`
      - Registers `sellerOnboarding: sellerOnboardingRouter`.
  - Mapper
    - `app/src/mappers/user.mapper.ts`
      - Excludes `seller_onboarding_step` and `accepted_seller_rules_at` from `Omit` in `mapCreateUserInboundDtoToUser`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `useSellerOnboarding()`: Fetches progress, exposes `handleAcceptRules`, `justCompletedStepIndex`, `clearCompletedAnimation`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - Progress bar + 11-step list (locked / active / completed states).
      - Step 0 form: rules list + "J'accepte les règles" button.
      - Inline `popup-bounce` animation on the completed step card via `onAnimationEnd`.
  - Routing
    - `app/client/src/App.tsx`
      - Adds `/seller-onboarding` protected route.
    - `app/client/src/pages/SellerUpsellPage/SellerUpsellPage.tsx`
      - CTA button navigates to `/seller-onboarding` instead of calling `requestSellerRole`.
  - Styles
    - `app/client/src/index.css`
      - Adds `@keyframes popup-bounce` and `--animate-popup-bounce` token.

## Manual operations to configure services

- None required.

## Status: completed
