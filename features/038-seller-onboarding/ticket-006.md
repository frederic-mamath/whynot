# Ticket 006 — Step 6: Average monthly revenue range

## Acceptance Criteria

- As a potential seller (Step 6), in `/seller-onboarding`, when the active step is step 6, I should see a list of revenue range options: "Less than €1,000", "€1,000 – €5,000", "€20,000 – €50,000", "€50,000 – €100,000", "€100,000 – €1,000,000", "More than €1,000,000".
- As a potential seller (Step 6), when I select one option, the step should animate and I should advance to step 7.
- As a system, the selection should be saved to `seller_onboarding_data.monthly_revenue_range` and `seller_onboarding_step` set to `6`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveMonthlyRevenue` (protectedProcedure mutation, input: `{ range: z.string() }`):
        - Upserts into `seller_onboarding_data` setting `monthly_revenue_range`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 6)`.
        - Returns `{ success: true, step: 6 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveMonthlyRevenueMutation`: on success triggers animation for step index `5`, invalidates progress.
      - Expose `handleSaveMonthlyRevenue(range: string)`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 5`, render a vertical list of selectable option cards (single-select). Tapping one calls `handleSaveMonthlyRevenue` immediately.

## Manual operations to configure services

- None required.
