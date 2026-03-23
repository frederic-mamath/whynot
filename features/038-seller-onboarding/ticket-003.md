# Ticket 003 — Step 3: Sub-category selection

## Acceptance Criteria

- As a potential seller (Step 3), in `/seller-onboarding`, when the active step is step 3, I should see a list of sub-categories relevant to the category I selected in step 2.
- For "Video games", the sub-categories are: "Retro games", "Modern games", "Consoles & accessories", "Guides, manuals & cases".
- As a potential seller (Step 3), when I select a sub-category, the step should animate and I should advance to step 4.
- As a system, the selected sub-category should be saved to `seller_onboarding_data.sub_category` and `seller_onboarding_step` set to `3`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `saveSubCategory` (protectedProcedure mutation, input: `{ subCategory: z.string() }`):
        - Upserts into `seller_onboarding_data` setting `sub_category`.
        - Calls `userRepository.updateSellerOnboardingStep(userId, 3)`.
        - Returns `{ success: true, step: 3 }`.
      - `getProgress` query: also return `category` from `seller_onboarding_data` so the frontend can display dynamic sub-category options.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.hooks.ts`
      - Extend `getProgress` query to also fetch `seller_onboarding_data` (add `category` to the return value).
      - `saveSubCategoryMutation`: on success triggers animation for step index `2`, invalidates progress.
      - Expose `handleSaveSubCategory(subCategory: string)`.
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - When `currentStepIndex === 2`, render a list of sub-category options derived from the saved `category`. Each option is a selectable card.
      - Sub-category map (static config in the page file):
        ```ts
        const SUB_CATEGORIES: Record<string, string[]> = {
          "Trading card games": ["Singles", "Sealed products", "Graded cards", "Accessories"],
          "Comics": ["French comics", "American comics", "Manga", "Collector editions"],
          "Sneakers & shoes": ["Sneakers", "Boots", "Sandals", "Accessories"],
          "Video games": ["Retro games", "Modern games", "Consoles & accessories", "Guides, manuals & cases"],
        };
        ```

## Manual operations to configure services

- None required.
