# Ticket 008 — Step 8: Team size

## Acceptance Criteria

- As a potential seller (Step 8), in `/seller-onboarding`, when the active step is step 8, I should see five options for my team size: "Just me", "2 – 3 people", "4 – 10 people", "11 – 50 people", "50+ people".
- As a potential seller (Step 8), when I select one option, the step should animate and I should advance to step 9.
- As a system, the selection should be saved to `seller_onboarding_data.team_size_range` and `seller_onboarding_step` set to `8`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveTeamSize` (protectedProcedure mutation, input: `{ range: z.string() }`):
        - Upserts into `seller_onboarding_data` setting `team_size_range`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 8)`.
        - Returns `{ success: true, step: 8 }`.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - `saveTeamSizeMutation`: on success triggers animation for step index `7`, invalidates progress.
      - Expose `handleSaveTeamSize(range: string)`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 7`, render five selectable option cards. Tapping one calls `handleSaveTeamSize` immediately.

## Manual operations to configure services

- None required.
