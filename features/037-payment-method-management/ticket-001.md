# Ticket 001 — Backend: detachPaymentMethod + deletePaymentMethod mutation

## Acceptance Criteria

- As a buyer, in the profile page, when I click the delete button on a payment method, the method is removed from my Stripe account and no longer appears in my profile.

## Technical Strategy

- Backend
  - Service
    - `app/src/services/StripeService.ts`
      - `detachPaymentMethod(paymentMethodId)`: Calls `stripe.paymentMethods.detach(paymentMethodId)`. Returns the detached PaymentMethod.
  - Router
    - `app/src/routers/payment.ts`
      - `deletePaymentMethod` (protectedProcedure, input: `{ paymentMethodId: z.string() }`): Retrieves the current user, verifies the payment method belongs to their stripe_customer_id (security check), then calls `stripeService.detachPaymentMethod`.

## Manual operations to configure services

- None required.

## Status: completed
