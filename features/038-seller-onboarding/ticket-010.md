# Ticket 010 — Step 10: Return address

## Acceptance Criteria

- As a potential seller (Step 10), in `/seller-onboarding`, when the active step is step 10, I should see a form asking for a return address (street, city, zip code, country) so that buyers know where to return items.
- As a potential seller (Step 10), when I fill in the required fields and click "Continuer", the step should animate and I should advance to step 11.
- As a system, the address fields should be saved to `seller_onboarding_data` (`return_street`, `return_city`, `return_zip_code`, `return_country`) and `seller_onboarding_step` set to `10`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveReturnAddress` (protectedProcedure mutation, input: `{ street: z.string().min(1), city: z.string().min(1), zipCode: z.string().min(1), country: z.string().min(1) }`):
        - Upserts into `seller_onboarding_data` setting `return_street`, `return_city`, `return_zip_code`, `return_country`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 10)`.
        - Returns `{ success: true, step: 10 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveReturnAddressMutation`: on success triggers animation for step index `9`, invalidates progress.
      - Expose `handleSaveReturnAddress(address: { street, city, zipCode, country })`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 9`, render a form with four `Input` fields (street, city, zip code, country) and a "Continuer" `ButtonV2`. Use `useState` for controlled inputs. Button disabled until all fields are non-empty.

## Manual operations to configure services

- None required.
