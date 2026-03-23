# Ticket 004 — Step 4: Seller type (Individual vs Registered Business)

## Acceptance Criteria

- As a potential seller (Step 4), in `/seller-onboarding`, when the active step is step 4, I should see two options: "Individual" (selling under my own name, not a registered business) and "Registered Business" (I own or work for an officially registered business).
- As a potential seller (Step 4), when I select one option, the step should animate and I should advance to step 5.
- As a system, the selection should be saved to `seller_onboarding_data.seller_type` (`"individual"` or `"registered_business"`) and `seller_onboarding_step` set to `4`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveSellerType` (protectedProcedure mutation, input: `{ sellerType: z.enum(["individual", "registered_business"]) }`):
        - Upserts into `seller_onboarding_data` setting `seller_type`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 4)`.
        - Returns `{ success: true, step: 4 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveSellerTypeMutation`: on success triggers animation for step index `3`, invalidates progress.
      - Expose `handleSaveSellerType(type: "individual" | "registered_business")`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 3`, render two large option cards with title, description, and an icon. Tapping one calls `handleSaveSellerType`.

## Manual operations to configure services

- None required.
