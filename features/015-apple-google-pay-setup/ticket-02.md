# Ticket 02 — Frontend: Payment Setup Dialog & Profile Page

## Acceptance Criteria

- As a user, in the profile page, I can see if I have a payment method configured (card brand, last 4)
- As a user, in the profile page, when I have no payment method, I see an alert with a CTA to add one
- As a user, in the profile page, when I click "Add payment method", a dialog opens with a card form
- As a user, in the payment dialog, I can save a card (and Apple Pay / Google Pay wallets if available)
- As a user, after saving a payment method, the dialog closes and the profile page reflects the new method

## Technical Strategy

- Frontend
  - Component
    - `app/client/src/components/PaymentSetupDialog/PaymentSetupDialog.tsx` _(new file)_
      - `SetupForm`: Inner form rendered inside `<Elements>` — calls `stripe.confirmSetup()` with `redirect: "if_required"`
      - `PaymentSetupDialog`: Dialog wrapper with `open/onOpenChange/onSuccess/blocking/title/description` props
      - `useEffect` watching `open` prop to trigger `createSetupIntent.mutate()` (Radix Dialog never calls `onOpenChange(true)`)
      - Error state with "Try again" button in case mutation fails or `stripePromise` is null
    - `app/client/src/components/PaymentSetupDialog/index.ts` _(new file)_
      - Re-export `PaymentSetupDialog`
  - Page
    - `app/client/src/pages/ProfilePage.tsx`
      - Add "Payment Method" card section between Personal Info and Addresses
      - Call `trpc.payment.getPaymentStatus.useQuery()` to fetch saved methods
      - Display methods with brand / last4 / wallet type badge
      - Show amber alert + "Add payment method" CTA when no method is saved
      - Embed `<PaymentSetupDialog>` controlled by local `open` state, refresh query on success

## Manual operations to configure services

- **Render (staging)**
  - Add `VITE_STRIPE_PUBLISHABLE_KEY` as an environment variable in the Render dashboard **before the build** — it is a Vite build-time variable (`import.meta.env.*`) and will be `undefined` if missing from the build environment, causing `stripePromise` to be `null` and showing an infinite spinner
