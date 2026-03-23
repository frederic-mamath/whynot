# Ticket 007 — Step 7: Item count range

## Acceptance Criteria

- As a potential seller (Step 7), in `/seller-onboarding`, when the active step is step 7, I should see four options for how many items I have to sell: "Less than 10 items", "10 – 100 items", "101 – 250 items", "More than 251 items".
- As a potential seller (Step 7), when I select one option, the step should animate and I should advance to step 8.
- As a system, the selection should be saved to `seller_onboarding_data.item_count_range` and `seller_onboarding_step` set to `7`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveItemCount` (protectedProcedure mutation, input: `{ range: z.string() }`):
        - Upserts into `seller_onboarding_data` setting `item_count_range`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 7)`.
        - Returns `{ success: true, step: 7 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveItemCountMutation`: on success triggers animation for step index `6`, invalidates progress.
      - Expose `handleSaveItemCount(range: string)`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 6`, render four selectable option cards. Tapping one calls `handleSaveItemCount` immediately.

## Manual operations to configure services

- None required.
