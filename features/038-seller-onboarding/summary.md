# Feature 038 — Seller Onboarding

**Initial prompt:**

As a user, I want to see my progress through the 11 steps so that I know how much effort is left to start selling.
As a potential seller (Step 0), I must agree to the platform rules so that I can proceed to Step 1 of the onboarding.
As a system, I need to securely update the user's progress in PostgreSQL when they accept the rules using Kysely.
As a brand, I want a "Popup" animation to trigger when a step is completed to reinforce the app's name and identity.

---

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a user, in `/vendre`, when I click "Commencer à vendre", I should be redirected to `/seller-onboarding` | completed |
| As a user, in `/seller-onboarding`, I should see a progress indicator showing all 11 steps and my current position | completed |
| As a potential seller (Step 0), in `/seller-onboarding`, when I read and accept the platform rules, I should see the step marked as completed with a "popup" bounce animation | completed |
| As a system, when a user accepts the rules, I should record `seller_onboarding_step = 1` and `accepted_seller_rules_at` in PostgreSQL | completed |
| As a potential seller (Step 2), in `/seller-onboarding`, when I select my main category, I should advance to step 3 | completed |
| As a potential seller (Step 3), in `/seller-onboarding`, when I select my sub-category, I should advance to step 4 | completed |
| As a potential seller (Step 4), in `/seller-onboarding`, when I choose Individual or Registered Business, I should advance to step 5 | completed |
| As a potential seller (Step 5), in `/seller-onboarding`, when I select where I currently sell or promote my inventory, I should advance to step 6 | completed |
| As a potential seller (Step 6), in `/seller-onboarding`, when I select my average monthly revenue range, I should advance to step 7 | completed |
| As a potential seller (Step 7), in `/seller-onboarding`, when I select how many items I have to sell, I should advance to step 8 | completed |
| As a potential seller (Step 8), in `/seller-onboarding`, when I select my team size, I should advance to step 9 | completed |
| As a potential seller (Step 9), in `/seller-onboarding`, when I select my weekly live availability, I should advance to step 10 | completed |
| As a potential seller (Step 10), in `/seller-onboarding`, when I fill in my return address, I should advance to step 11 | completed |
| As a potential seller (Step 11), in `/seller-onboarding`, when I submit my application, my seller role request should be created and I should see a confirmation screen | completed |
