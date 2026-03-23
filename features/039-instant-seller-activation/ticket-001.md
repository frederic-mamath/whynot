# Ticket 001 — Instant SELLER role activation + post-onboarding routing

## Acceptance Criteria

- As a user completing step 10, in `/seller-onboarding`, when I click "Devenir vendeur", my SELLER role should be granted immediately with `activated_at` set (no pending state, no admin approval).
- As a user completing step 10, after activation, I should see a celebration screen "Félicitations, vous êtes vendeur !" with a CTA to `/seller/shop`.
- As a seller, in the bottom navigation, when I tap "Vendre", I should be routed to `/seller/shop`.
- As a seller, when I navigate directly to `/vendre`, I should be redirected to `/seller/shop`.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/sellerOnboarding.ts`
      - `submitApplication` mutation: pass `activatedBy: ctx.userId` and `activatedAt: new Date()` to `userRoleRepository.createUserRole(...)` so the `user_roles` row is inserted with `activated_at` already set — making the role immediately active.
      - No changes to `UserRoleRepository` — `createUserRole` already accepts optional `activatedBy` and `activatedAt` fields.

- Frontend
  - Page
    - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
      - Step 10 recap card: update copy from "notre équipe l'examinera sous 48 h" to "Cliquez pour activer votre compte vendeur."
      - Submit button label: "Devenir vendeur" (was "Envoyer ma demande").
      - Remove the `sellerStatus === "pending"` UI block (no longer reachable for new submissions).
      - Success CTA: navigate to `/seller/shop` (was `/seller`).
  - Component
    - `app/client/src/components/BottomNav/BottomNav.tsx`
      - `handleVendre`: navigate to `/seller/shop` for sellers (was `/seller/lives`).
      - `navItems` path: `isSeller ? "/seller/shop" : "/vendre"` (was `/seller/lives`).
  - Page
    - `app/client/src/pages/SellerUpsellPage/SellerUpsellPage.tsx`
      - Add `trpc.role.myRoles.useQuery()` check at the top of the component.
      - If `isSeller`, return `<Navigate to="/seller/shop" replace />` before rendering the upsell content.

## Manual operations to configure services

- None required.
