# Ticket 009 — Step 9: Weekly live availability

## Acceptance Criteria

- As a potential seller (Step 9), in `/seller-onboarding`, when the active step is step 9, I should see four options for how many hours per week I (and/or my team) could go live: "1 – 2 hours", "3 – 10 hours", "11 – 20 hours", "More than 20 hours".
- As a potential seller (Step 9), when I select one option, the step should animate and I should advance to step 10.
- As a system, the selection should be saved to `seller_onboarding_data.live_hours_range` and `seller_onboarding_step` set to `9`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveLiveHours` (protectedProcedure mutation, input: `{ range: z.string() }`):
        - Upserts into `seller_onboarding_data` setting `live_hours_range`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 9)`.
        - Returns `{ success: true, step: 9 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveLiveHoursMutation`: on success triggers animation for step index `8`, invalidates progress.
      - Expose `handleSaveLiveHours(range: string)`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 8`, render four selectable option cards. Tapping one calls `handleSaveLiveHours` immediately.

## Manual operations to configure services

- None required.
