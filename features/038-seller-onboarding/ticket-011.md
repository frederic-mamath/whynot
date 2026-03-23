# Ticket 011 — Step 11: Submit seller application + status feedback

## Acceptance Criteria

- As a potential seller (Step 11), in `/seller-onboarding`, when all previous steps are completed and I reach step 11, I should see a summary screen confirming my application is ready to submit.
- As a potential seller (Step 11), when I click "Envoyer ma demande", my seller role request should be created (pending admin approval) and `seller_onboarding_step` should be set to `11`.
- As a potential seller (Step 11), after submitting, I should see a confirmation screen: "Demande envoyée — notre équipe examine votre profil."
- As a returning user, when I come back to `/seller-onboarding` after submitting, I should see the confirmation screen immediately (no re-submit button).
- As an approved seller, when I come back to `/seller-onboarding`, I should see "Félicitations, vous êtes vendeur !" with a link to my shop.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `submitApplication` (protectedProcedure mutation):
        - Guards: if `seller_onboarding_step < 10`, throws BAD_REQUEST "Complete all steps first".
        - Guards: if a pending or active SELLER role already exists, throws BAD_REQUEST.
        - Calls existing `userRoleRepository.createUserRole({ userId, roleId: sellerRole.id })` (reuses logic from `roleRouter.requestSellerRole`).
        - Calls `userRepository.updateSellerOnboardingStep(userId, 11)`.
        - Returns `{ success: true }`.
      - `getProgress` query: also return the user's SELLER role status (`"none"` | `"pending"` | `"active"`) by querying `user_roles` joined with `roles`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `submitApplicationMutation`: on success invalidates progress.
      - Expose `handleSubmitApplication()`, `sellerStatus` (`"none" | "pending" | "active"`).
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 10`:
        - If `sellerStatus === "none"`: render a recap card + "Envoyer ma demande" button.
        - If `sellerStatus === "pending"`: render a waiting screen ("Notre équipe examine votre profil…").
        - If `sellerStatus === "active"`: render a success screen with a link to `/seller`.

## Manual operations to configure services

- None required.
