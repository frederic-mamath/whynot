# Ticket 01 — Backend: Stripe Customer & SetupIntent

## Acceptance Criteria

- As a buyer, when I trigger payment setup, a Stripe Customer is created and saved to my account if none exists
- As a buyer, when I trigger payment setup, a SetupIntent client secret is returned
- As a buyer, when I try to place a bid server-side without a saved payment method, I receive an error
- As a buyer, when I try to buyout server-side without a saved payment method, I receive an error

## Technical Strategy

- Backend
  - Database
    - `app/migrations/021_add_stripe_customer_to_users.ts`
      - `up`: Add nullable `stripe_customer_id TEXT` column to `users` table
      - `down`: Drop `stripe_customer_id` column
  - Types
    - `app/src/db/types.ts`
      - `UsersTable`: Add `stripe_customer_id: string | null`
  - Mapper
    - `app/src/mappers/user.mapper.ts`
      - `toUser`: Map `stripe_customer_id: null` default
  - Repository
    - `app/src/repositories/UserRepository.ts`
      - `updateStripeCustomerId(userId, stripeCustomerId)`: Update user's Stripe customer ID
  - Service
    - `app/src/services/StripeService.ts`
      - `createCustomer({ email, userId })`: Create a Stripe Customer via `stripe.customers.create()`
      - `createSetupIntent({ customerId })`: Create a SetupIntent with `payment_method_types: ['card']`
      - `listPaymentMethods({ customerId })`: List saved payment methods via `stripe.paymentMethods.list()`
      - `hasPaymentMethod({ customerId })`: Boolean check — does the customer have at least one saved PM?
  - Router
    - `app/src/routers/payment.ts` _(new file)_
      - `getPaymentStatus`: Protected query — returns `hasPaymentMethod` + list of saved payment methods
      - `createSetupIntent`: Protected mutation — lazy-creates Stripe Customer, returns `clientSecret`
    - `app/src/routers/index.ts`
      - Register `payment: paymentRouter`
  - Guard
    - `app/src/routers/auction.ts`
      - `requirePaymentMethod(userId)`: Helper function — throws `FORBIDDEN` if no payment method saved
      - `placeBid`: Call `requirePaymentMethod(userId)` at the start
      - `buyout`: Call `requirePaymentMethod(userId)` at the start

## Manual operations to configure services

- **Stripe Dashboard** (test mode)
  - No manual configuration needed for cards and Google Pay in test mode
  - Apple Pay on staging/production: Settings → Payment methods → Apple Pay → Add domain `whynot-app.onrender.com` and host the verification file at `/.well-known/apple-developer-merchantid-domain-association`
