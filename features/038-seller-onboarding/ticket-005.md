# Ticket 005 — Step 5: Current selling channels (multi-select)

## Acceptance Criteria

- As a potential seller (Step 5), in `/seller-onboarding`, when the active step is step 5, I should see a multi-select list of channels: "Website", "My store or warehouse", "Other platforms (Shopify, Etsy, Amazon…)", "Social media", "Nowhere, just starting".
- As a potential seller (Step 5), I should be able to select multiple options simultaneously.
- As a potential seller (Step 5), when I confirm my selection with a "Continuer" button, the step should animate and I should advance to step 6.
- As a system, the selections should be saved to `seller_onboarding_data.selling_channels` (text array) and `seller_onboarding_step` set to `5`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveSellingChannels` (protectedProcedure mutation, input: `{ channels: z.array(z.string()).min(1) }`):
        - Upserts into `seller_onboarding_data` setting `selling_channels`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 5)`.
        - Returns `{ success: true, step: 5 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveSellingChannelsMutation`: on success triggers animation for step index `4`, invalidates progress.
      - Expose `handleSaveSellingChannels(channels: string[])`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 4`, render a list of toggleable channel chips with a `useState` array for tracking selected values.
      - Show a "Continuer" `ButtonV2` that is enabled only when at least one option is selected.

## Manual operations to configure services

- None required.
