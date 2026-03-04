# Feature 015 — Apple Pay / Google Pay Payment Setup

## Overview
Allow buyers to configure a payment method (card, Apple Pay, Google Pay) via Stripe SetupIntent. Display payment status in profile, and block bids/buyouts unless a payment method is saved.

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a user, in the profile page, I can see if I have a payment system configured | completed |
| As a user, in the profile page, I can add a payment method (card, Apple Pay, Google Pay) | completed |
| As a buyer, in the channel details page, when I try to bid without a payment method, I see a blocking dialog | completed |
| As a buyer, in the channel details page, when I try to buyout without a payment method, I see a blocking dialog | completed |
| As a buyer, I cannot place a bid server-side without a saved payment method (defense-in-depth) | completed |

## Architecture Decisions
- **SetupIntent** (not manual capture): We verify a payment method is registered, without holding funds. Actual payment remains on /my-orders after winning.
- **`stripe_customer_id`** added to `users` table — distinct from `stripe_account_id` (which is for Connect sellers, unused).
- **`automatic_payment_methods: true`** on SetupIntent: Stripe automatically offers card, Apple Pay, Google Pay based on device/browser and Stripe Dashboard config.
- **Blocking dialog**: Impossible to bid or buyout without a saved payment method (frontend + backend guard).

## Files Changed

### Backend
- `app/migrations/018_add_stripe_customer_to_users.ts` — New migration
- `app/src/db/types.ts` — Added `stripe_customer_id` to `UsersTable`
- `app/src/mappers/user.mapper.ts` — Added `stripe_customer_id: null` to mapper
- `app/src/repositories/UserRepository.ts` — Added `updateStripeCustomerId()`
- `app/src/services/StripeService.ts` — Added `createCustomer`, `createSetupIntent`, `listPaymentMethods`, `hasPaymentMethod`
- `app/src/routers/payment.ts` — New router with `getPaymentStatus` and `createSetupIntent`
- `app/src/routers/index.ts` — Registered `paymentRouter`
- `app/src/routers/auction.ts` — Added `requirePaymentMethod()` guard to `placeBid` and `buyout`

### Frontend
- `app/client/src/components/PaymentSetupDialog/` — New component: Stripe SetupIntent + PaymentElement
- `app/client/src/components/PaymentRequiredDialog/` — New component: Blocking dialog before bid
- `app/client/src/components/BidInput/BidInput.tsx` — Added `hasPaymentMethod` + `onPaymentRequired` props
- `app/client/src/components/AuctionWidget/AuctionWidget.tsx` — Added payment guard props
- `app/client/src/components/ChatPanel/ChatPanel.tsx` — Added payment status query + dialog
- `app/client/src/pages/ProfilePage.tsx` — Added Payment Method section
