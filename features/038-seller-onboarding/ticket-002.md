# Ticket 002 — Step 2: Main category selection

## Acceptance Criteria

- As a potential seller (Step 2), in `/seller-onboarding`, when the active step is step 2, I should see a grid of category options: "Trading card games", "Comics", "Sneakers & shoes", "Video games".
- As a potential seller (Step 2), when I tap a category card, it should be visually selected, the step should animate with the popup-bounce, and I should advance to step 3.
- As a system, the selected category should be saved to `seller_onboarding_data.category` and `seller_onboarding_step` set to `2`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveCategory` (protectedProcedure mutation, input: `{ category: z.string() }`):
        - Upserts into `seller_onboarding_data` (insert or update on conflict `user_id`) setting `category`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 2)`.
        - Returns `{ success: true, step: 2 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveCategoryMutation`: wraps `trpc.sellerOnboarding.saveCategory.useMutation`, on success triggers animation for step index `1` and invalidates progress query.
      - Expose `handleSaveCategory(category: string)`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 1`, render a 2×2 grid of category cards (icon + label). Tapping one calls `handleSaveCategory`.

## Manual operations to configure services

- None required.
